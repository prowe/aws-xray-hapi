const Hapi = require('hapi');

// process.env.AWS_XRAY_DEBUG_MODE=true;
// const AWSXRay = require('aws-xray-sdk-core');
// AWSXRay.setStreamingThreshold(1);
//AWSXRay.captureAWS(AWS);


const init = async () => {
    const server = Hapi.server({
        port: 3000,
        debug: {
            log: '*',
            request: '*'
        }
    });

    await server.register(require('./hapi-x-ray'));
    server.route(require('./GetDataController'));

    await server.start();
    console.log(`Server running at: ${server.info.uri}`);
};

process.on('unhandledRejection', (err) => {
    console.log(err);
    process.exit(1);
});

init();