#!/bin/bash

sudo npm install -g bdsd.sock --unsafe-perm
sudo npm install -g bdsd-cli --unsafe-perm

SERVICE_NAME=bdsd.service

mkdir $HOME/.config/systemd
mkdir $HOME/.config/systemd/user
touch $HOME/.config/systemd/user/$SERVICE_NAME

SERVICE_PATH=$HOME/.config/systemd/user/$SERVICE_NAME

echo "[Unit]" > $SERVICE_PATH
echo "Description=Bobaos Datapoint Sdk Daemon" >> $SERVICE_PATH
echo "[Service]" >> $SERVICE_PATH
echo "ExecStart=/usr/bin/env bdsd.sock" >> $SERVICE_PATH
echo "[Install]" >> $SERVICE_PATH
echo "WantedBy=default.target" >> $SERVICE_PATH
systemctl --user daemon-reload
systemctl --user enable $SERVICE_NAME
sudo loginctl enable-linger pi
systemctl --user start $SERVICE_NAME
