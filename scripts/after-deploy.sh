#!/bin/bash
REPOSITORY=/home/ubuntu/build

cd $REPOSITORY

/usr/bin/npm i

/usr/bin/pm2 start app.js

#nvm으로 node를 설치하면 직접 경로를 지정해야함