
const AWS = require('aws-sdk');
const sts = new AWS.STS({
    region: 'us-east-1'
});
const codepipeline = new AWS.CodePipeline({
    region: 'us-east-1'
});

async function handler(request, h) {
    console.log('in handler');
    const [identity, pipelines] = await Promise.all([
        sts.getCallerIdentity({}).promise(), 
        codepipeline.listPipelines({}).promise()
    ]);
    throw new Error('error here');
    return h.response({identity, pipelines});
}

module.exports = {
    method: 'GET',
    path: '/{id}',
    handler
};