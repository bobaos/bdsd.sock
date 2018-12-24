const net = require("net");
const fs = require("fs");
const EE = require("events").EventEmitter;

const FrameParser = require("./Parser");
const { composeFrame } = require("./compose");

// DONE: Bobaos Datapoint Sdk Message
// |B|D|S|M|<L>|<DATA>|<CR>
// <L> = <DATA>.length (~)
// <CR> = sum(<DATA>) % 256
// Bobaos Datapoint Sdk unix domain socket
let BdsdIPC = socketFileParam => {
  let SOCKETFILE = process.env["XDG_RUNTIME_DIR"] + "/bdsd.sock";
  let SHUTDOWN = false;

  if (typeof socketFileParam !== "undefined") {
    SOCKETFILE = socketFileParam;
  }

  let connections = [];
  let ipc = new EE();
  let server;

  const createServer = socketFile => {
    return net
      .createServer(stream => {
        // callback function to send data
        const writeCb = data => {
          try {
            stream.write(composeFrame(data));
          } catch (e) {
            console.log("IPC: error in writeCb:", e);
          }
        };

        let connectionId = Math.round(Math.random() * Date.now());
        let connection = { stream: stream, id: connectionId, writeCb: writeCb };
        connections.push(connection);
        const frameParser = new FrameParser();
        stream.pipe(frameParser);

        // error handling
        // emit event ipc
        ipc.emit("connected", connectionId, writeCb);

        frameParser.on("data", data => {
          // DONE: process parsed data to api.js
          // DONE: var #1:
          // DONE: 1) EE ipc emits event 'request'
          // DONE: 2) index.js already subscribed to this event with callback([data, writeCb]) that do following:
          // DONE:    *** parse request. if wrong, then send error to this socket.
          // DONE:    *** if request is good then send data to bobaos, process response and send data to socket.
          ipc.emit("request", data, connectionId, writeCb);
        });

        // delete connection from connections array
        const forgetConnection = _ => {
          const findConnById = t => t.id === connection.id;
          let connectionIndex = connections.findIndex(findConnById);
          if (connectionIndex >= 0) {
            connections.splice(connectionIndex, 1);
          }
        };
        stream.on("error", e => {
          console.log("IPC: error with socket ", connectionId, e);
          console.log("IPC: disconnecting", connectionId);
          forgetConnection();
        });
        stream.on("end", _ => {
          console.log("IPC: disconnect", connection.id);
          forgetConnection();
        });
      })
      .listen(socketFile);
  };

  console.log("IPC: Checking for leftover socket.");
  fs.stat(SOCKETFILE, function(err, stats) {
    if (err) {
      // start server
      console.log("IPC: No leftover socket found.");
      console.log("IPC: Listening at ", SOCKETFILE);
      server = createServer(SOCKETFILE);
      if (server) {
        console.log("IPC: emitting ready state");
        ipc.emit("ready");
      }
      return;
    }
    // remove file then start server
    console.log(`IPC: ${SOCKETFILE} already exist. Removing.`);
    fs.unlink(SOCKETFILE, err => {
      if (err) throw err;
      console.log("IPC: Listening at ", SOCKETFILE);
      server = createServer(SOCKETFILE);
      if (server) {
        console.log("IPC: emitting ready state");
        ipc.emit("ready");
      }
    });
  });

  // close all connections when the user does CTRL-C
  function cleanup() {
    if (!SHUTDOWN) {
      SHUTDOWN = true;
      console.log("\n", "IPC: Terminating.", "\n");
      connections.forEach(t => {
        console.log("IPC: Disconnecting", t.timestamp);
        t.stream.write(composeFrame(JSON.stringify({ id: 1, method: "disconnect" })));
        t.stream.end();
      });
      server.close();
      process.exit(0);
    }
  }

  process.on("SIGINT", cleanup);

  // broadcast
  ipc.broadcast = (data, except) => {
    let to = [];
    if (typeof except !== "undefined") {
      to = connections.filter(t => {
        return t.id !== except;
      });
    } else {
      to = connections.slice();
    }
    to.forEach(t => {
      console.log("IPC: broadcasting data", data);
      t.writeCb(data);
    });
  };
  return ipc;
};

module.exports = BdsdIPC;
