#!/bin/bash
REPOSITORY=/home/ubuntu/build

cd $REPOSITORY

sudo /usr/bin/yarn

sudo /usr/bin/pm2 start dist

#nvm으로 node를 설치하면 직접 경로를 지정해야함.