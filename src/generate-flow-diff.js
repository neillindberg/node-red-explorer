/**
 * Load flow functions into memory.
 * Do a comparison on flow + tab/subflow function body (in 'func' prop)
 */
// Leaning on NodeJS >= v10 for fs.promises library.
const fs = require('fs');
const path = require('path');
const _ = require('lodash');
const {rmRf, normalizeStringForFS} = require('./utils/utils');
// Ensure we go through every node on both functions lists
// name + location.name + location.type = unique
const getDuplicatesWithinSelf = (funcs) => {
    const duplicatesInSelf = [];
    funcs.forEach((funcA, iA) => {
        funcs.forEach((funcB, iB) => {
            if (_.isEqual(funcA, funcB) && iA !== iB) {
                if (!duplicatesInSelf.find(x => x.name === funcA.name && _.isEqual(x.location, funcA.location))) duplicatesInSelf.push(funcA);
            }
        });
    });
    return duplicatesInSelf;
};
//
const doDiff = (funcs1, funcs2) => {
    return funcs1.filter((func1) => {
        const match = funcs2.find(x => _.isEqual(x.name, func1.name) && _.isEqual(x.func, func1.func) && _.isEqual(x.location, func1.location));
        if (match) return false; // filter all matches out.
        return true;
    });
};
// Write files per diff if no weird stuff happened to this point.
// console.log(diffsCombined.map(diff => `[${diff.name}] in [${diff.location.name} (${diff.location.type})]`));
//
let writeCount = 0;
const writeFunctionFiles = (branchName, functions) => {
    const branchFunctionsPath = path.join(__dirname, '../', 'flows', branchName);
    if (fs.existsSync(branchFunctionsPath)) rmRf(branchFunctionsPath);
    fs.mkdirSync(branchFunctionsPath);
    functions.forEach(entry => {
        const { location, name, func } = entry;
        const locationName = normalizeStringForFS(location.name) + ((location.type === 'subflow') ? '_subflow' : '');
        const locationPath = path.join(branchFunctionsPath, locationName);
        if (fs.existsSync(locationPath)) rmRf(locationPath);
        fs.mkdirSync(locationPath);
        const functionFile = normalizeStringForFS(name) + '.js';
        const filePath = path.join(locationPath, functionFile);
        const formattedFunction = JSON.parse(JSON.stringify(func, null, 4));
        fs.writeFileSync(filePath, formattedFunction);
        // console.log(filePath);
        writeCount++;
    });
};


module.exports = {
    do: (branches, files) => {
        const [fx1FileName, fx2FileName] = files;
        if (!fx1FileName || !fx2FileName) throw 'File names are not defined. Two flow JSON files are required.';
        //
        const fx1 = JSON.parse(fs.readFileSync(fx1FileName));
        const fx2 = JSON.parse(fs.readFileSync(fx2FileName));
        console.log(`Processing ${fx1.length} functions from: ${fx1FileName},`);
        console.log(`   against ${fx2.length} functions from: ${fx2FileName}`);
        // Do diffs both ways to make sure we don't miss deleted/add stuff from one flow vs. another.
        const diffs1 = doDiff(fx1, fx2);
        const diffs2 = doDiff(fx2, fx1);
        console.log(diffs1.length, ` differences found between two provided flows ${fx1FileName}`);
        console.log(diffs2.length, ` differences found between two provided flows ${fx2FileName}`);
        // Merge arrays or ensure unique.
        // Combine 1 & 2 and check IT for dups.
        const diffsCombined = [...diffs1, ...diffs2];
        console.log(getDuplicatesWithinSelf(diffsCombined).length, ' duplicates when combined diffs.');
        //
        // TODO: Not hardcoded, por favor
        writeFunctionFiles('branch-' + branches[0], diffs1);
        writeFunctionFiles('branch-' + branches[1], diffs2);
        console.log(`${diffsCombined.length / writeCount * 100}% of diff'd function files written. Happy diffing!`);
    }
};