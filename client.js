const SOCKETFILE = process.env['XDG_RUNTIME_DIR'] + '/bdsd.sock';
const net = require('net');
const FrameParser = require('./FrameHelpers/Parser');
const {composeFrame} = require('./FrameHelpers/compose');

////////////////

////////////////

var client = net.createConnection(SOCKETFILE);

client.on("connect", function () {
  console.log('connected');

  const send = data => {
    client.write(composeFrame(JSON.stringify(data)));
  };
  let a = true;
  const bunch = _ => {
    send({hello: 1, meow: 2});
    send({hello: 2, meow: 2});
    send({hello: 3, meow: 2});
    send({hello: 4, meow: 2});
    send({hello: 5, meow: 4});
    send({hello: 6, meow: 4});
    send({hello: 7, meow: 0});
    send({hello: 8, meow: 1});
    send({hello: 9, meow: 2});
    send({hello: 0, meow: 3});
    send({hello: 1, meow: 4});
    // if (a)
    send({a: a});
    a = !a;
  };
  bunch();
  client.write(composeFrame("azaza"));
  let wrongFrame = composeFrame("there something wrong with me");
  // wrongFrame.writeUInt8(78, wrongFrame.length - 1);
  client.write(wrongFrame);
  client.write(composeFrame("good frame!"));

  // process incoming data
  const frameParser = new FrameParser();
  frameParser.on('data', data => {
    console.log('got frame from server:', data.toStrinFrameParserg());
  });
  client.pipe(frameParser);
});

client.on("data", function (data) {
  //console.log(data.toString());
});