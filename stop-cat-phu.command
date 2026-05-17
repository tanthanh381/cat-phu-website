#!/bin/zsh
SESSION_NAME="cat-phu-website"

if /usr/bin/screen -list | /usr/bin/grep -q "$SESSION_NAME"; then
  /usr/bin/screen -S "$SESSION_NAME" -X quit
  echo "Đã dừng server Cát Phú."
else
  echo "Server Cát Phú không chạy trong screen session."
fi
