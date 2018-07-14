const Hapi = require('hapi');

process.env.AWS_XRAY_DEBUG_MODE=true;

const AWSXRay = require('aws-xray-sdk-core');
AWSXRay.setStreamingThreshold(1);
const AWS = require('aws-sdk');
AWSXRay.captureAWS(AWS);
const sts = new AWS.STS({
    region: 'us-east-1'
});

const init = async () => {
    const server = Hapi.server({
        port: 3000,
        debug: {
            log: '*',
            request: '*'
        }
    });

    server.ext({
        type: 'onRequest',
        method: function (request, h) {
            console.log('onRequest');
            const segment = new AWSXRay.Segment('seg-1');
            request.segment = segment;
            const ns = AWSXRay.getNamespace();
            const context = ns.createContext();
            ns.enter(context);
            request.xrayContext = context;
            AWSXRay.setSegment(segment);
            return h.continue;
        }
    });

    server.events.on('response', function (request, h) {
        console.log('response');
        if(request.closeSegment) {
            request.closeSegment();
        }
        if(request.segment) {
            request.segment.close();
        }
        if(request.xrayContext) {
            const ns = AWSXRay.getNamespace();
            ns.exit(request.xrayContext);
        }
    });

    server.route({
        method: 'GET',
        path: '/',
        handler: async (request, h) => {
            console.log('in handler', AWSXRay);
            const identity = await sts.getCallerIdentity({})
                .promise();
            return h.response(identity);
        }
    });

    await server.start();
    console.log(`Server running at: ${server.info.uri}`);
};

process.on('unhandledRejection', (err) => {
    console.log(err);
    process.exit(1);
});

init();