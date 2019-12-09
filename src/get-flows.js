const fs = require('fs');
const path = require('path');
const Cloudant = require('@cloudant/cloudant');
const cloudant = Cloudant('https://a210bafe-ffb2-4869-825a-601db86f769d-bluemix:0f26fcae092694bedbbb3899b5df4140c9f34ab7086ff2b902f92e294b7f0a6d@a210bafe-ffb2-4869-825a-601db86f769d-bluemix.cloudant.com');
const db = cloudant.db.use('nodered');
const buildFlowFunctionFiles = require('./build-flow-function-files');
const generateFlowDiff = require('./generate-flow-diff');

// const flows = ['Stellaris-Flow-n/flow', 'Stellaris-Flow-x/flow'];
const flowsDirectory = path.join(__dirname, '../flows');
if (!fs.existsSync(flowsDirectory)) fs.mkdirSync(flowsDirectory);

const flows = ['Stellaris-Flow-r/flow', 'Stellaris-Flow-x/flow'];
const writeFlowFile = async (_id) => {
    return new Promise((resolve, reject) => {
        db.find({ selector: { _id } }, (err, result) => {
            if (err) {
                reject(err);
            }
            const flowJSON = result.docs[0];
            const flowFileName = _id.toLowerCase().replace(/\//g, '_') + '.json';
            const flowFilePath = path.join(flowsDirectory, flowFileName);
            fs.writeFile(flowFilePath, JSON.stringify(flowJSON, null, 4), err => {
                if (err) throw err;
                console.log('File added: ', flowFilePath);
                resolve(flowFilePath);
            });
        });
    });

};

Promise.all(flows.map(writeFlowFile))
    .then(async flowFiles => {
        const flowFunctionFiles = await buildFlowFunctionFiles.go(flowFiles);
        // console.log('DIFF THESE: ', flowFunctionFiles);
        generateFlowDiff.do(flowFunctionFiles);
    });