#!/bin/bash
REPOSITORY=/home/ubuntu/build

cd $REPOSITORY

sudo /home/ubuntu/.nvm/versions/node/v18.16.0/bin/npm i
sudo /home/ubuntu/.nvm/versions/node/v18.16.0/bin/pm2 start dist

#nvm으로 node를 설치하면 직접 경로를 지정해야함.