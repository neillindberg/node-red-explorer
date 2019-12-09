/**
 * Load flow functions into memory.
 * Do a comparison on flow + tab/subflow function body (in 'func' prop)
 */
// Leaning on NodeJS >= v10 for fs.promises library.
const fs = require('fs');
const path = require('path');
const _ = require('lodash');
//
const files = process.argv.slice(2);
const [funcFileName1, funcFileName2] = files;
if (!funcFileName1 || !funcFileName2) throw ('File names are not defined. Two flow JSON files are required.');
//
const functions1 = JSON.parse(fs.readFileSync(funcFileName1));
const functions2 = JSON.parse(fs.readFileSync(funcFileName2));
console.log(`Processing ${functions1.length} functions from: ${funcFileName1},`);
console.log(`   against ${functions2.length} functions from: ${funcFileName2}`);
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
// TODO: Should we not cleanup these dups, or exclude them, or something?
const duplicatesInSelf = false; // TODO: Discuss clean up and/or ignore of self-duplicates using: getDuplicatesWithinSelf(functions1);
if (duplicatesInSelf) {
    console.log('Within the same flow there are %d duplicates found.', duplicatesInSelf.length);
    duplicatesInSelf.sort((a, b) => (a.name < b.name) ? -1 : (a.name > b.name) ? 1 : 0);
    console.log(duplicatesInSelf.map(dup => `[${dup.name}] in [${dup.location.name} (${dup.location.type})]`));
}

// Same name, same location (name/type), DIFFERENT func.
// TODO: If different function write to branch-specific directory under ../flows/tmp/<specific_branch>/
//         TODO: using existing ftf -n "Function Name"
const doDiff = (funcs1, funcs2) => {
    return funcs1.filter((func1) => {
        const match = funcs2.find(x => _.isEqual(x.name, func1.name) && _.isEqual(x.func, func1.func) && _.isEqual(x.location, func1.location));
        if (match) return false; // filter all matches out.
        return true;
    });
};
// Do diffs both ways to make sure we don't miss deleted/add stuff from one flow vs. another.
const diffs1 = doDiff(functions1, functions2);
const diffs2 = doDiff(functions2, functions1);
console.log(`${diffs1.length} differences found between two provided flows ${funcFileName1}`);
console.log(`${diffs2.length} differences found between two provided flows ${funcFileName2}.`);
// Merge arrays or ensure unique.
// Combine 1 & 2 and check IT for dups.
const diffsCombined = [...diffs1, ...diffs2];
console.log(getDuplicatesWithinSelf(diffsCombined).length, ' duplicates when combined diffs.');
// Write files per diff if no weird stuff happened to this point.
// console.log(diffsCombined.map(diff => `[${diff.name}] in [${diff.location.name} (${diff.location.type})]`));
const normalizeStringForFS = (str) => {
    return str.toLowerCase()
        .replace(/\./g, '_')
        .replace(/:/g, '_')
        .replace(/\?/g, '-question-mark')
        .replace(/\s{0,}-+\s{0,}/g, '_')
        .replace(/\s+/g, '_');
};
//
let writeCount = 0;
const writeFunctionFiles = (branchName, functions) => {
    const branchFunctionsPath = path.join(__dirname, '../', 'flows', branchName);
    if (!fs.existsSync(branchFunctionsPath)) fs.mkdirSync(branchFunctionsPath);
    functions.forEach(entry => {
        const { location, name, func } = entry;
        const locationName = normalizeStringForFS(location.name) + ((location.type === 'subflow') ? '_subflow' : '');
        const locationPath = path.join(branchFunctionsPath, locationName);
        if (!fs.existsSync(locationPath)) fs.mkdirSync(locationPath);
        const functionFile = normalizeStringForFS(name) + '.js';
        const filePath = path.join(locationPath, functionFile);
        const formattedFunction = JSON.parse(JSON.stringify(func, null, 4));
        fs.writeFileSync(filePath, formattedFunction);
        // console.log(filePath);
        writeCount++;
    });
};
// TODO: Not hardcoded, por favor
writeFunctionFiles('dev-r', diffs1);
writeFunctionFiles('dev-x', diffs2);
console.log(`${diffsCombined.length / writeCount * 100}% of diff'd function files written. Happy diffing!`);