
process.env.AWS_XRAY_DEBUG_MODE=true;
const AWSXRay = require('aws-xray-sdk-core');
const AWS = require('aws-sdk');

AWSXRay.setStreamingThreshold(1);
AWSXRay.captureAWS(AWS);

const name = 'hapi-x-ray';

function onRequest(request, h) {
    const segment = new AWSXRay.Segment('seg-1');
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
        segment.close();
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