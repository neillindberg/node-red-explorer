const fs = require('fs');
const path = require('path');
const jsonpath = require('jsonpath');

const functionsPath = path.join(__dirname, '../../', 'tmp', 'functions');
// TODO: Determine: <module>/<subflow> to put functions under and do writes like: ./tmp/functions/logs/edhr/birth_email.js
/**
 * @description Find (functionBody) and write (functionFile) function to file by node name, i.e. "Birth EDHR" = birth_edhr.js
 * @param {string} functionName
 * @returns {boolean} 
 */
const writeFunctionToFile = (functionName, jsonData) => {
    console.log(`$[?(@.name == '${functionName}')]['func']`);
    const functionBody = jsonpath.query(jsonData, `$[?(@.name == '${functionName}')]['func']`);
    if (functionBody) {
        const functionFile = functionName.toLowerCase().replace(/\s+/g, '-') + '.js';
        fs.writeFile(path.join(functionsPath, functionFile), functionBody[0], err => {
            if (err) {
                console.log(`Error wrting '${functionName}' to ${functionFile}`, err);
                return;
            }
            console.log(`Done writing func of '${functionName}' to file: ${functionFile}`);
            return;
        });
    } else {
        console.log(`Nothing found matching function name '${functionName}'`);
        return;
    }
};

const writeFunctionByName = (inJSON /*for todo in adding new functions.json on run*/, functionName) => {
    if (!fs.existsSync(functionsPath)) {
        fs.mkdirSync(functionsPath);
    }
    // TODO: Automatically render a new funcitons.json first!
    const functionsFile = 'functions.json';
    fs.readFile(path.join('tmp', functionsFile), (err, data) => {
        if (err) {
            console.log(`Error reading '${functionsFile}: `, err);
            return;
        }
        const jsonData = JSON.parse(data);
        writeFunctionToFile(functionName, jsonData);
    });    
};

module.exports = {
    writeFunctionByName
};