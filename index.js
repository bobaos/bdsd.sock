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
});

ipc.on('request', (data, writeCb) => {

});

// bobaos datapoint sdk events
sdk.on('connected', _ => {

});