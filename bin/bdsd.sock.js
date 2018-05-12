#!/usr/bin/env node 

// using default params
let params = {
  serialPortDevice: '/dev/ttyO1'
};

require('../index.js')(params);
