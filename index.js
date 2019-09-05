// Conversion script
const _ = require('lodash');

const result = _.forEach([1, 2, 3], n => n * 10).values();

console.log(result);

module.exports = {};