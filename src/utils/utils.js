const fs = require('fs');
const path = require('path');

const normalizeStringForFS = (str) => {
    return str.toLowerCase()
        .replace(/\./g, '_')
        .replace(/:/g, '_')
        .replace(/&/g, '_and_')
        .replace(/\//g, '_')
        .replace(/\?/g, '-question-mark')
        .replace(/\s{0,}-+\s{0,}/g, '_')
        .replace(/\s+/g, '_');
};

const rmRf = (folderPath) => {
    if (fs.existsSync(folderPath)) {
        fs.readdirSync(folderPath).forEach(file => {
            const curPath = path.join(folderPath, file);
            if (fs.lstatSync(curPath).isDirectory()) { // recurse
                rmRf(curPath);
            } else { // delete file
                fs.unlinkSync(curPath);
            }
        });
        fs.rmdirSync(folderPath);
    }
};

module.exports = {
    normalizeStringForFS,
    rmRf
};