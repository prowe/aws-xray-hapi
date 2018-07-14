
const AWS = require('aws-sdk');

const sts = new AWS.STS();

sts.getCallerIdentity({}).promise()
    .then(r => console.log(r), e => console.error(e));