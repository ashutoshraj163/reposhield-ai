"""
Intentionally vulnerable Python file — static analysis fixture only.
Do NOT execute this code against real inputs.
"""
import subprocess
import sqlite3
import os


# CWE-78: OS command injection — shell=True with user input
def run_command(user_input):
    return subprocess.run(
        user_input,
        shell=True,
        capture_output=True,
        text=True,
    )


# CWE-89: SQL injection — string-formatted query
def get_user(username, conn):
    query = "SELECT * FROM users WHERE username = '%s'" % username
    cursor = conn.cursor()
    cursor.execute(query)
    return cursor.fetchone()


# CWE-78: Another command injection via os.system
def ping_host(host):
    os.system("ping -c 1 " + host)


# CWE-259: Hardcoded password
def connect_db():
    return sqlite3.connect("app.db")


DB_PASSWORD = "supersecret123"
API_KEY = "sk-prod-abcdef1234567890"
