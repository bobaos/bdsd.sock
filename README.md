# bdsd - baos datapoint sdk daemon

This module intended to solve architecturing problem when developing js applcation for KNX.
Nodejs connects to BAOS 838 module via serial port, usually /dev/ttyAMA0 and it handles only one connection at a time.
But what if you want to connect to KNX bus multiple clients? 
If you want to write some custom scripts and use this device as a MQTT gateway at a same time?

So, schematically it may look like this:

![meow](./scheme.png)

# Installation

Assuming you have Raspberry Pi with installed Raspbian with configured access to BAOS module via /dev/ttyAMA0.

```sh
$ git clone https://github.com/shabunin/bdsd.sock
$ cd bdsd.sock/
$ npm install
$ sudo cp -R ../bdsd.sock /opt/
$ sudo cp ./bdsd.service /etc/systemd/system/
$ sudo systemctl daemon-reload
$ sudo systemctl enable bdsd.sock
$ sudo systemctl start bdsd.sock
```

# Usage in js

For js applications there will be available client-side library which you may install from npm.

Further information you can find in repo: [bdsd.client](https://github.com/shabunin/bdsd.client)

# Usage with other programming languages

For other programming languages you may implement client-side library which should communicate with IPC following [Bobaos Datapoint Sdk Message Protocol](./PROTOCOL.md).
