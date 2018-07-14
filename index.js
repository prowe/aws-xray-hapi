console.log('starting: ', process.version);

const fetch = require('node-fetch');

process.env.AWS_XRAY_DEBUG_MODE=true
const AWSXRay = require('aws-xray-sdk-core');
AWSXRay.setStreamingThreshold(1);

const segment = new AWSXRay.Segment('seg-1');
const ns = AWSXRay.getNamespace();

function sleep(seconds) {
    return new Promise(resolve => {
        setTimeout(resolve, seconds * 1000);
    });
}

async function getLocation() {
    const result = await fetch('https://www.metaweather.com/api/location/search/?query=Des+Moines');
}

ns.run(async () => {
    AWSXRay.setSegment(segment);
    await getLocation();
    segment.close();
});


