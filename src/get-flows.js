const fs = require('fs');
const path = require('path');
const buildFlowFunctionFiles = require('./build-flow-function-files');
const generateFlowDiff = require('./generate-flow-diff');
//
const setup = require('../setup');
const Cloudant = require('@cloudant/cloudant');
const cloudant = Cloudant(setup.connString);
const db = cloudant.db.use('nodered');
//
const flowString = (branch) => (setup && setup.flowNameFormatter) ? setup.flowNameFormatter(branch) : branch;
const branches = process.argv.slice(2);
if (branches.length !== 2) process.exit();
const flows = branches.map(flowString);
console.log('Preparing for diff report with: ', flows.join(' & '));
//

//
const flowsDirectory = path.join(__dirname, '../flows');
if (!fs.existsSync(flowsDirectory)) fs.mkdirSync(flowsDirectory);

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
        generateFlowDiff.do(branches, flowFunctionFiles);
    });