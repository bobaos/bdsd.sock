#!/bin/bash

export XDG_RUNTIME_DIR="/run/user/$UID"
echo $XDG_RUNTIME_DIR
/usr/bin/node ./index.js