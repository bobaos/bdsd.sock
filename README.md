# bdsd - baos datapoint sdk daemon

This module intended to solve architecturing problem when developing js applcation for KNX.
Nodejs connects to BAOS 838 module via serial port, usually /dev/ttyAMA0 and it handles only one connection at a time.
But what if you want to connect to KNX bus multiple clients? 
If you want to write some custom scripts and use this device as a MQTT gateway at a same time?

So, schematically it may look like this:

![meow](./scheme.png)

# Installation

Assuming you have Raspberry Pi with installed Raspbian with configured access to BAOS module via /dev/ttyAMA0.

If not, follow instructions on [bobaos repository page](https://github.com/shabunin/bobaos#installation)

**1. Clone repository to home folder, install dependencies.**

```
$ cd ~/
$ git clone https://github.com/shabunin/bdsd.sock
$ cd ~/bdsd.sock/
$ npm install
```

Check if it executes correctly:

```
$ node index.js
Checking for leftover socket.
No leftover socket fount.
Listening at /run/user/1000/bdsd.sock
.....
.....
got bus state: connected
```

**2. Create systemd service folders, copy service file**

```
$ cd ~/
$ mkdir ~/.config/systemd
$ mkdir ~/.config/systemd/user
$ cp ~/bdsd.sock/bdsd.service ~/.config/systemd/user/
```

**3. Enable service, enable automatic start-up**

```
$ systemctl --user daemon-reload
$ systemctl --user enable bdsd.service
$ sudo loginctl enable-linger pi
```

**4. Start the service**

```
$ systemctl --user start bdsd.service
```

 **5. Check with [bdsd-cli](https://github.com/shabunin/bdsd-cli)

```
$ sudo npm -g install bdsd-cli
$ bdsd-cli
connected
bobaos> setProgrammingMode -v 1
Set programming mode: success
bobaos> getValue -s 1
{ id: 1, value: true } 
bobaos>
```
# Usage in js

For js applications there will be available client-side library which you may install from npm.

Further information you can find in repo: [bdsd.client](https://github.com/shabunin/bdsd.client)

# Usage with other programming languages

For other programming languages you may implement client-side library which should communicate with IPC following [Bobaos Datapoint Sdk Message Protocol](./PROTOCOL.md).
