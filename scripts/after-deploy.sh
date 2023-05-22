#!/bin/bash
REPOSITORY=/home/ubuntu/build

cd $REPOSITORY

export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"  # This loads nvm bash_completion

npm i
pm2 start /home/ubuntu/build/dist/app.js

#nvm으로 node를 설치하면 직접 경로를 지정해야함