#!/bin/zsh
SESSION_NAME="cat-phu-website"

if /usr/bin/screen -list | /usr/bin/grep -q "$SESSION_NAME"; then
  echo "Server Cát Phú đang chạy."
  echo "Website: http://127.0.0.1:5500/"
  echo "Admin:   http://127.0.0.1:5500/admin"
else
  echo "Server Cát Phú chưa chạy. Chạy ./start-cat-phu.command để khởi động."
fi
