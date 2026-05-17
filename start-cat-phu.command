#!/bin/zsh
cd "$(dirname "$0")" || exit 1

SESSION_NAME="cat-phu-website"
PORT_VALUE="${PORT:-5500}"

/usr/bin/screen -S "$SESSION_NAME" -X quit >/dev/null 2>&1
/usr/bin/screen -dmS "$SESSION_NAME" /bin/zsh -lc "cd '$PWD' && PORT=$PORT_VALUE /usr/bin/python3 server.py"

sleep 1
echo "Cát Phú website đang chạy:"
echo "Website: http://127.0.0.1:$PORT_VALUE/"
echo "Admin:   http://127.0.0.1:$PORT_VALUE/admin"
echo ""
echo "Mật khẩu admin mặc định: catphu2026"
echo "Dừng server bằng: ./stop-cat-phu.command"
