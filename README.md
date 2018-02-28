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
$ sudo cp bdsd.sock/bdsd.service /etc/systemd/system/
$ sudo systemctl daemon-reload
$ sudo systemctl enable bdsd.sock
$ sudo systemctl start bdsd.sock
```

# Usage in js
