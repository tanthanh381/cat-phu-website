#!/usr/bin/env python3
import json
import os
import subprocess
import sys
import time
import urllib.error
import urllib.request


ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PORT = "5588"
BASE_URL = f"http://127.0.0.1:{PORT}"
SITE_FILE = os.path.join(ROOT, "data", "site.json")
LEADS_FILE = os.path.join(ROOT, "data", "leads.json")


def request(path, method="GET", data=None, headers=None):
    body = None
    final_headers = headers.copy() if headers else {}
    if data is not None:
        body = json.dumps(data).encode("utf-8") if not isinstance(data, bytes) else data
        final_headers.setdefault("Content-Type", "application/json")
    req = urllib.request.Request(
        BASE_URL + path,
        data=body,
        headers=final_headers,
        method=method,
    )
    try:
        with urllib.request.urlopen(req, timeout=5) as response:
            return response.status, dict(response.headers), response.read()
    except urllib.error.HTTPError as error:
        return error.code, dict(error.headers), error.read()


def assert_equal(actual, expected, label):
    if actual != expected:
        raise AssertionError(f"{label}: expected {expected}, got {actual}")


def assert_true(condition, label):
    if not condition:
        raise AssertionError(label)


def start_server():
    env = os.environ.copy()
    env["PORT"] = PORT
    env["PYTHONPYCACHEPREFIX"] = "/private/tmp/catphu-pycache"
    return subprocess.Popen(
        [sys.executable, "server.py"],
        cwd=ROOT,
        env=env,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
    )


def wait_until_ready(process):
    deadline = time.time() + 8
    while time.time() < deadline:
        if process.poll() is not None:
            output = process.stdout.read() if process.stdout else ""
            raise RuntimeError(f"Server stopped early:\n{output}")
        try:
            status, _, _ = request("/api/content")
            if status == 200:
                return
        except Exception:
            pass
        time.sleep(0.2)
    raise RuntimeError("Server did not become ready in time.")


def main():
    with open(SITE_FILE, "rb") as file:
        original_site = file.read()
    with open(LEADS_FILE, "rb") as file:
        original_leads = file.read()

    process = start_server()
    try:
        wait_until_ready(process)

        status, headers, _body = request("/api/content")
        assert_equal(status, 200, "public content should be readable")
        assert_true("Access-Control-Allow-Origin" not in headers, "CORS wildcard should not be present")
        assert_equal(headers.get("X-Frame-Options"), "DENY", "frame protection header")
        assert_equal(headers.get("X-Content-Type-Options"), "nosniff", "MIME sniffing header")

        status, headers, _body = request("/admin")
        assert_equal(status, 200, "admin HTML should load")
        assert_equal(headers.get("Cache-Control"), "no-store", "admin HTML should not be cached")
        assert_true("Content-Security-Policy" in headers, "admin HTML should include CSP")

        status, _headers, _body = request("/api/leads")
        assert_equal(status, 401, "lead list should require auth")

        status, login_headers, _body = request("/api/login", "POST", {"password": "catphu2026"})
        assert_equal(status, 200, "valid login should succeed with cookie")
        session_cookie = login_headers.get("Set-Cookie", "")
        assert_true("HttpOnly" in session_cookie, "session cookie should be HttpOnly")
        assert_true("SameSite=Strict" in session_cookie, "session cookie should be SameSite Strict")
        auth_headers = {"Cookie": session_cookie.split(";", 1)[0]}

        status, _headers, body = request("/api/session", headers=auth_headers)
        assert_equal(status, 200, "session endpoint should respond")
        assert_true(json.loads(body.decode("utf-8"))["authenticated"], "session should be authenticated")

        status, _headers, content_body = request("/api/content")
        content = json.loads(content_body.decode("utf-8"))
        status, _headers, _body = request("/api/content", "PUT", content)
        assert_equal(status, 401, "content save should require auth")
        status, _headers, _body = request("/api/content", "PUT", content, auth_headers)
        assert_equal(status, 200, "content save should work when authenticated")

        status, _headers, _body = request("/api/leads", "POST", {"name": "QC", "phone": "abc"})
        assert_equal(status, 400, "invalid phone should be rejected")
        status, _headers, _body = request(
            "/api/leads",
            "POST",
            {"name": "QC", "phone": "0900000000", "area": "TP.HCM", "message": "test"},
        )
        assert_equal(status, 200, "valid lead should be accepted")

        status, _headers, _body = request("/api/leads", "POST", b'{"name":"' + (b"a" * (513 * 1024)) + b'"}')
        assert_equal(status, 413, "oversized body should be rejected")

        for _attempt in range(5):
            request("/api/login", "POST", {"password": "wrong-password"})
        status, _headers, _body = request("/api/login", "POST", {"password": "wrong-password"})
        assert_equal(status, 429, "brute force lockout should activate")

        print("OK: security checks passed")
    finally:
        process.terminate()
        try:
            process.wait(timeout=3)
        except subprocess.TimeoutExpired:
            process.kill()
        with open(SITE_FILE, "wb") as file:
            file.write(original_site)
        with open(LEADS_FILE, "wb") as file:
            file.write(original_leads)


if __name__ == "__main__":
    main()
