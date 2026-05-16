#!/usr/bin/env python3
import hmac
import json
import mimetypes
import os
import posixpath
import re
import secrets
import time
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote, urlparse


ROOT = Path(__file__).resolve().parent
PUBLIC_DIR = ROOT / "public"
DEFAULT_DATA_DIR = ROOT / "data"
DATA_DIR = Path(os.environ.get("CAT_PHU_DATA_DIR", str(DEFAULT_DATA_DIR))).expanduser()
if not DATA_DIR.is_absolute():
    DATA_DIR = (ROOT / DATA_DIR).resolve()
CONTENT_FILE = DATA_DIR / "site.json"
LEADS_FILE = DATA_DIR / "leads.json"
SEED_CONTENT_FILE = DEFAULT_DATA_DIR / "site.json"
IS_RENDER = os.environ.get("RENDER") == "true"
DEFAULT_ADMIN_PASSWORD = "catphu2026"
ADMIN_PASSWORD_FROM_ENV = os.environ.get("CAT_PHU_ADMIN_PASSWORD")
ADMIN_PASSWORD = ADMIN_PASSWORD_FROM_ENV or ("" if IS_RENDER else DEFAULT_ADMIN_PASSWORD)
ADMIN_ENABLED = bool(ADMIN_PASSWORD)
USING_DEFAULT_ADMIN_PASSWORD = ADMIN_PASSWORD == DEFAULT_ADMIN_PASSWORD and not ADMIN_PASSWORD_FROM_ENV
COOKIE_NAME = "catphu_admin"
COOKIE_SECURE = IS_RENDER or os.environ.get("CAT_PHU_SECURE_COOKIE") == "true"
SESSION_TTL_SECONDS = 8 * 60 * 60
LOCKOUT_SECONDS = 5 * 60
MAX_LOGIN_ATTEMPTS = 5
MAX_BODY_BYTES = 512 * 1024
MAX_CONTENT_BYTES = 1024 * 1024
TOKENS = {}
FAILED_LOGINS = {}


class RequestError(Exception):
    def __init__(self, status, message):
        self.status = status
        self.message = message


def read_json(path, fallback):
    if not path.exists():
        return fallback
    with path.open("r", encoding="utf-8") as file:
        return json.load(file)


def write_json(path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as file:
        json.dump(data, file, ensure_ascii=False, indent=2)
        file.write("\n")


def ensure_data_files():
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    if not CONTENT_FILE.exists():
        write_json(CONTENT_FILE, read_json(SEED_CONTENT_FILE, {}))
    if not LEADS_FILE.exists():
        write_json(LEADS_FILE, [])


def trim_text(value, limit):
    text = str(value or "").replace("\x00", "").strip()
    if len(text) > limit:
        return text[:limit].rstrip()
    return text


def validate_json_shape(value, depth=0):
    if depth > 8:
        raise RequestError(400, "Dữ liệu quá nhiều cấp lồng nhau.")
    if isinstance(value, dict):
        if len(value) > 120:
            raise RequestError(400, "Dữ liệu có quá nhiều trường.")
        for item in value.values():
            validate_json_shape(item, depth + 1)
        return
    if isinstance(value, list):
        if len(value) > 150:
            raise RequestError(400, "Danh sách dữ liệu quá dài.")
        for item in value:
            validate_json_shape(item, depth + 1)
        return
    if isinstance(value, str):
        if len(value) > 8000:
            raise RequestError(400, "Một trường nội dung đang quá dài.")
        return
    if value is None or isinstance(value, (bool, int, float)):
        return
    raise RequestError(400, "Dữ liệu chứa kiểu không được hỗ trợ.")


def validate_content(payload):
    if not isinstance(payload, dict) or "company" not in payload:
        raise RequestError(400, "Dữ liệu website không hợp lệ.")
    if len(json.dumps(payload, ensure_ascii=False).encode("utf-8")) > MAX_CONTENT_BYTES:
        raise RequestError(413, "Dữ liệu website vượt quá 1MB.")
    validate_json_shape(payload)


def is_loopback_host(host):
    return host in {"127.0.0.1", "localhost", "::1"}


class CatPhuHandler(BaseHTTPRequestHandler):
    server_version = "CatPhuWebsite/1.0"
    sys_version = ""

    def do_GET(self):
        parsed = urlparse(self.path)
        if parsed.path == "/api/content":
            self.send_json(read_json(CONTENT_FILE, {}))
            return
        if parsed.path == "/api/session":
            self.send_json({"authenticated": self.is_authenticated(), "admin_enabled": ADMIN_ENABLED})
            return
        if parsed.path == "/api/leads":
            if not self.is_authenticated():
                self.send_json({"error": "Bạn cần đăng nhập admin."}, 401)
                return
            self.send_json(read_json(LEADS_FILE, []))
            return
        self.serve_static(parsed.path)

    def do_HEAD(self):
        parsed = urlparse(self.path)
        if parsed.path == "/api/content":
            self.send_json(read_json(CONTENT_FILE, {}), head=True)
            return
        if parsed.path == "/api/session":
            self.send_json({"authenticated": self.is_authenticated(), "admin_enabled": ADMIN_ENABLED}, head=True)
            return
        if parsed.path == "/api/leads":
            if not self.is_authenticated():
                self.send_json({"error": "Bạn cần đăng nhập admin."}, 401, head=True)
                return
            self.send_json(read_json(LEADS_FILE, []), head=True)
            return
        self.serve_static(parsed.path, head=True)

    def do_POST(self):
        parsed = urlparse(self.path)
        if parsed.path == "/api/login":
            if not ADMIN_ENABLED:
                self.send_json({"error": "Admin đang tắt. Vui lòng cấu hình CAT_PHU_ADMIN_PASSWORD trên máy chủ."}, 503)
                return
            if not self.is_same_origin_request():
                self.send_json({"error": "Yêu cầu không cùng nguồn."}, 403)
                return
            if self.is_login_locked():
                self.send_json({"error": "Đăng nhập sai quá nhiều lần. Vui lòng thử lại sau 5 phút."}, 429)
                return
            try:
                payload = self.read_body()
            except RequestError as error:
                self.send_json({"error": error.message}, error.status)
                return
            password = str(payload.get("password", "")).strip()
            if not hmac.compare_digest(password, ADMIN_PASSWORD):
                self.record_login_failure()
                self.send_json({"error": "Mật khẩu không đúng."}, 401)
                return
            self.clear_login_failures()
            token = secrets.token_urlsafe(32)
            TOKENS[token] = time.time() + SESSION_TTL_SECONDS
            self.send_json(
                {"ok": True, "message": "Đăng nhập thành công."},
                headers={"Set-Cookie": self.session_cookie(token)},
            )
            return
        if parsed.path == "/api/logout":
            if not self.is_same_origin_request():
                self.send_json({"error": "Yêu cầu không cùng nguồn."}, 403)
                return
            token = self.get_auth_token()
            if token:
                TOKENS.pop(token, None)
            self.send_json(
                {"ok": True, "message": "Đã đăng xuất."},
                headers={"Set-Cookie": self.expired_session_cookie()},
            )
            return
        if parsed.path == "/api/leads":
            try:
                payload = self.read_body()
            except RequestError as error:
                self.send_json({"error": error.message}, error.status)
                return
            phone = trim_text(payload.get("phone"), 32)
            name = trim_text(payload.get("name"), 80)
            if not name or not phone:
                self.send_json({"error": "Vui lòng nhập họ tên và số điện thoại."}, 400)
                return
            if not re.fullmatch(r"[0-9+().\-\s]{7,32}", phone):
                self.send_json({"error": "Số điện thoại chưa đúng định dạng."}, 400)
                return
            lead = {
                "id": secrets.token_hex(6),
                "created_at": datetime.now(timezone.utc).isoformat(),
                "name": name,
                "phone": phone,
                "area": trim_text(payload.get("area"), 120),
                "service": trim_text(payload.get("service"), 80),
                "budget": trim_text(payload.get("budget"), 80),
                "message": trim_text(payload.get("message"), 1000),
            }
            leads = read_json(LEADS_FILE, [])
            leads.insert(0, lead)
            write_json(LEADS_FILE, leads)
            self.send_json({"ok": True, "message": "Cát Phú đã nhận thông tin tư vấn."})
            return
        self.send_json({"error": "Không tìm thấy API."}, 404)

    def do_PUT(self):
        parsed = urlparse(self.path)
        if parsed.path != "/api/content":
            self.send_json({"error": "Không tìm thấy API."}, 404)
            return
        if not ADMIN_ENABLED:
            self.send_json({"error": "Admin đang tắt. Vui lòng cấu hình CAT_PHU_ADMIN_PASSWORD trên máy chủ."}, 503)
            return
        if not self.is_same_origin_request():
            self.send_json({"error": "Yêu cầu không cùng nguồn."}, 403)
            return
        if not self.is_authenticated():
            self.send_json({"error": "Bạn cần đăng nhập admin."}, 401)
            return
        try:
            payload = self.read_body()
            validate_content(payload)
        except RequestError as error:
            self.send_json({"error": error.message}, error.status)
            return
        payload["updated_at"] = datetime.now(timezone.utc).isoformat()
        write_json(CONTENT_FILE, payload)
        self.send_json({"ok": True, "message": "Đã lưu nội dung website."})

    def do_OPTIONS(self):
        self.send_response(204)
        self.add_security_headers()
        self.send_header("Access-Control-Allow-Methods", "GET, POST, PUT, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def read_body(self):
        length = int(self.headers.get("Content-Length", "0") or 0)
        if length > MAX_BODY_BYTES:
            raise RequestError(413, "Dữ liệu gửi lên vượt quá 512KB.")
        if length == 0:
            return {}
        raw = self.rfile.read(length)
        try:
            return json.loads(raw.decode("utf-8"))
        except json.JSONDecodeError:
            raise RequestError(400, "JSON không hợp lệ.")

    def get_auth_token(self):
        cookie_header = self.headers.get("Cookie", "")
        for part in cookie_header.split(";"):
            name, _, value = part.strip().partition("=")
            if name == COOKIE_NAME and value:
                return value
        return ""

    def is_authenticated(self):
        if not ADMIN_ENABLED:
            return False
        token = self.get_auth_token()
        if not token:
            return False
        expiry = TOKENS.get(token)
        if not expiry:
            return False
        if expiry < time.time():
            TOKENS.pop(token, None)
            return False
        return True

    def request_origin(self):
        scheme = "https" if (COOKIE_SECURE or self.headers.get("X-Forwarded-Proto") == "https") else "http"
        host = self.headers.get("Host", "")
        return f"{scheme}://{host}" if host else ""

    def is_same_origin_request(self):
        expected = self.request_origin()
        for header_name in ("Origin", "Referer"):
            header_value = self.headers.get(header_name)
            if not header_value:
                continue
            parsed = urlparse(header_value)
            actual = f"{parsed.scheme}://{parsed.netloc}"
            if expected and actual != expected:
                return False
        return True

    def is_login_locked(self):
        record = FAILED_LOGINS.get(self.client_address[0])
        return bool(record and record.get("locked_until", 0) > time.time())

    def record_login_failure(self):
        ip = self.client_address[0]
        record = FAILED_LOGINS.setdefault(ip, {"count": 0, "locked_until": 0})
        record["count"] += 1
        if record["count"] >= MAX_LOGIN_ATTEMPTS:
            record["locked_until"] = time.time() + LOCKOUT_SECONDS
            record["count"] = 0

    def clear_login_failures(self):
        FAILED_LOGINS.pop(self.client_address[0], None)

    def session_cookie(self, token):
        secure = "; Secure" if COOKIE_SECURE else ""
        return f"{COOKIE_NAME}={token}; Path=/; HttpOnly; SameSite=Strict{secure}; Max-Age={SESSION_TTL_SECONDS}"

    def expired_session_cookie(self):
        secure = "; Secure" if COOKIE_SECURE else ""
        return f"{COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Strict{secure}; Max-Age=0"

    def add_security_headers(self, content_type=""):
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("X-Frame-Options", "DENY")
        self.send_header("Referrer-Policy", "same-origin")
        self.send_header("Permissions-Policy", "camera=(), microphone=(), geolocation=()")
        if COOKIE_SECURE:
            self.send_header("Strict-Transport-Security", "max-age=31536000; includeSubDomains")
        if content_type.startswith("text/html"):
            self.send_header(
                "Content-Security-Policy",
                "default-src 'self'; "
                "script-src 'self'; "
                "style-src 'self'; "
                "img-src 'self' data: https:; "
                "connect-src 'self'; "
                "base-uri 'self'; "
                "form-action 'self'; "
                "frame-ancestors 'none'",
            )

    def send_json(self, data, status=200, head=False, headers=None):
        body = json.dumps(data, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.add_security_headers("application/json; charset=utf-8")
        self.send_header("Cache-Control", "no-store")
        for key, value in (headers or {}).items():
            self.send_header(key, value)
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        if not head:
            self.wfile.write(body)

    def serve_static(self, request_path, head=False):
        if request_path in ("", "/"):
            relative = "index.html"
        elif request_path == "/admin":
            relative = "admin.html"
        else:
            relative = unquote(request_path).lstrip("/")

        normalized = posixpath.normpath(relative)
        if normalized.startswith("../"):
            self.send_error(403)
            return

        file_path = (PUBLIC_DIR / normalized).resolve()
        try:
            file_path.relative_to(PUBLIC_DIR.resolve())
        except ValueError:
            self.send_error(403)
            return

        if not file_path.exists() or not file_path.is_file():
            self.send_error(404)
            return

        content_type = mimetypes.guess_type(str(file_path))[0] or "application/octet-stream"
        content = file_path.read_bytes()
        self.send_response(200)
        self.send_header("Content-Type", content_type)
        self.add_security_headers(content_type)
        if file_path.suffix in {".html", ".js", ".css"}:
            self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(content)))
        self.end_headers()
        if not head:
            self.wfile.write(content)

    def log_message(self, format, *args):
        print("%s - %s" % (self.address_string(), format % args))


def main():
    port = int(os.environ.get("PORT", "5500"))
    host = os.environ.get("CAT_PHU_BIND_HOST") or ("0.0.0.0" if IS_RENDER else "127.0.0.1")
    if USING_DEFAULT_ADMIN_PASSWORD and not is_loopback_host(host):
        raise SystemExit("Không được dùng mật khẩu admin mặc định khi bind public. Hãy đặt CAT_PHU_ADMIN_PASSWORD.")
    ensure_data_files()
    server = ThreadingHTTPServer((host, port), CatPhuHandler)
    display_base = os.environ.get("RENDER_EXTERNAL_URL") or f"http://127.0.0.1:{port}"
    print(f"Cát Phú website đang chạy tại {display_base}/")
    print(f"Trang admin: {display_base}/admin")
    print(f"Thư mục dữ liệu: {DATA_DIR}")
    if not ADMIN_ENABLED:
        print("Cảnh báo: admin đang tắt vì chưa cấu hình CAT_PHU_ADMIN_PASSWORD.")
    elif USING_DEFAULT_ADMIN_PASSWORD:
        print("Cảnh báo: đang dùng mật khẩu admin mặc định chỉ dành cho local development.")
    print("Dừng server bằng Ctrl+C")
    server.serve_forever()


if __name__ == "__main__":
    main()
