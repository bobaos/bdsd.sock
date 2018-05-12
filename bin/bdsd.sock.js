#!/usr/bin/env node

// commandline arguments
const argv = require('yargs')
  .option('sockfile', {
    alias: 's',
    describe: `path to socket file. Default: ${process.env['XDG_RUNTIME_DIR']}/bdsd.sock'`,
  })
  .option('serialport-device', {
    alias: 'd',
    describe: 'path to serialport device. Default: /dev/ttyAMA0',
  })
  .option('serialport-params', {
    alias: 'p',
    describe: 'serialport parameters: "baud rate,parity,data bits,stop bits". Default: "19200,even,8,1"',
  })
  .argv;

// using default params
let params = {
  sockFile: argv['sockfile'],
  serialPortDevice: argv['serialport-device'],
  serialPortParams: argv['serialport-params']
};

require('../index.js')(params);
