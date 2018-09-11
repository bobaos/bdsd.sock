#!/bin/bash

echo "bdsd_install.sh >>>> sudo npm install -g bdsd.sock@latest --unsafe-perm"
sudo npm install -g bdsd.sock@latest --unsafe-perm
echo "bdsd_install.sh >>>> sudo npm install -g bdsd-cli@latest --unsafe-perm"
sudo npm install -g bdsd-cli@latest --unsafe-perm

SERVICE_NAME=bdsd.service

echo "bdsd_install.sh >>>> mkdir -p $HOME/.config/systemd/user"

mkdir -p $HOME/.config/systemd/user 
echo "bdsd_install.sh >>>> touch $HOME/.config/systemd/user/$SERVICE_NAME"
touch $HOME/.config/systemd/user/$SERVICE_NAME

SERVICE_PATH=$HOME/.config/systemd/user/$SERVICE_NAME

echo "bdsd_install.sh >>>> Creating service file"
echo "[Unit]" > $SERVICE_PATH
echo "Description=Bobaos Datapoint Sdk Daemon" >> $SERVICE_PATH
echo "[Service]" >> $SERVICE_PATH
echo "ExecStart=/usr/bin/env bdsd.sock" >> $SERVICE_PATH
echo "StandardOutput=null" >> $SERVICE_PATH
echo "[Install]" >> $SERVICE_PATH
echo "WantedBy=default.target" >> $SERVICE_PATH

echo ""
cat $SERVICE_PATH
echo ""

echo "bdsd_install.sh >>>> Reloading systemctl daemons"
systemctl --user daemon-reload
echo "bdsd_install.sh >>>> Enabling service"
systemctl --user enable $SERVICE_NAME

echo "bdsd_install.sh >>>> Enable lingering for user pi"
sudo loginctl enable-linger pi

echo "bdsd_install.sh >>>> Starting service"
systemctl --user start $SERVICE_NAME
