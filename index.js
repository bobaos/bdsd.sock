// TODO: require server.js
// TODO: import ipc object
// TODO: register cb for 'connected' event with
// TODO: register cb for 'request' event. send data on response

// IPC
const ipc = require('./ipc/server');
// datapoint sdk
const sdk = require('./datapointSdk/sdk')();

let baosConnected = false;

// interprocess communication events
ipc.on('connected', (id, writeCb) => {
  console.log('index.js connected from ipc: ', id);
  writeCb('connection response');
  if (baosConnected) {
    writeCb('baos connected')
  }
});

ipc.on('request', (data, writeCb) => {
  let dataStr = data.toString();
  // TODO: process message by BDSM PROTOCOL
  try {
    let req = JSON.parse(dataStr);
    console.log(req);
  } catch (e) {
    writeCb(JSON.stringify({sucess: false, payload: {id: dataStr, message: 'Wrong JSON'}}))
  }
});

// bobaos datapoint sdk events
sdk.on('connected', _ => {
  baosConnected = true;
});

