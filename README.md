# bdsd - baos datapoint sdk daemon

This module intended to solve architecturing problem when developing js applcation for KNX.
Nodejs connects to BAOS 838 module via serial port, usually /dev/ttyAMA0 and it handles only one connection at a time.
But what if you want to connect to KNX bus multiple clients? 
If you want to write some custom scripts and use this device as a MQTT gateway at a same time?