#!/usr/bin/env node

const program = require('commander');

program
  .option(
    '-s --sockfile <path>',
    `path to socket file. Default: ${process.env['XDG_RUNTIME_DIR']}/bdsd.sock`
  )
  .option(
    '-d --device <path>',
    `path to serialport device. Default: /dev/ttyAMA0`
  )
  .option(
    '-p --params [value]',
    `serialport parameters: "baud rate, parity, data bits, stop bits". Default: "19200,even,8,1"`
  )
  .parse(process.argv);

// using default params
let params = {
  sockFile: `${process.env['XDG_RUNTIME_DIR']}/bdsd.sock`,
  serialPortDevice: `/dev/ttyAMA0`,
  serialPortParams: `19200,even,8,1`
};

if (program['sockfile']) {
  params.sockFile = program['sockfile'];
}
if (program['device']) {
  params.serialPortDevice = program['device'];
}
if (program['params']) {
  params.serialPortParams = program['params'];
}

console.log(params);

require('../index.js')(params);
