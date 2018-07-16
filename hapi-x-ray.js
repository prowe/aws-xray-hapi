
process.env.AWS_XRAY_DEBUG_MODE=true;
const AWSXRay = require('aws-xray-sdk-core');
const {Segment, middleware} = AWSXRay;
const IncomingRequestData = middleware.IncomingRequestData;
const AWS = require('aws-sdk');

AWSXRay.setStreamingThreshold(1);
AWSXRay.captureAWS(AWS);

const name = 'hapi-x-ray';

function onRequest(request, h) {
    const amznTraceHeader = middleware.processHeaders(request.raw.req);
    const segment = new Segment('prowe-test-top',amznTraceHeader.Root, amznTraceHeader.Parent);
    segment.addIncomingRequestData(new IncomingRequestData(request.raw.req));
    const ns = AWSXRay.getNamespace();
    const context = ns.createContext();

    request.plugins[name] = {
        context,
        segment
    };

    ns.enter(context);
    AWSXRay.setSegment(segment);
    return h.continue;
}

function onResponse(request) {
    const pluginState = request.plugins[name];
    if(pluginState) {
        const {context, segment} = pluginState;

        const causeType = AWSXRay.utils.getCauseTypeFromHttpStatus(request.response.statusCode);
        if (causeType) {
            segment[causeType] = true;
        }

        const route = request.route;
        if (route) {
            segment.addMetadata('rawUrl', segment.http.request.url);
            segment.http.request.url = route.path;
        }

        segment.close(request.response._error);
        segment.http.close(request.raw.res);
        AWSXRay.getNamespace().exit(context);        
    }
}

async function register(server, options) {
    server.ext({
        type: 'onRequest',
        method: onRequest
    });
    server.events.on('response', onResponse);
}

module.exports = {
    name,
    register
}