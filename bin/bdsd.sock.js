#!/usr/bin/env node 
const yargs = require('yargs');

// using default params
let params = {
  serialPortDevice: '/dev/ttyO1'
};

require('../index.js')(params);
