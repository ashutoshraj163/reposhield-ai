"""
Intentionally vulnerable secrets fixture — static analysis only, never run.
"""

# Hardcoded credentials — CWE-798
AWS_ACCESS_KEY_ID = "AKIAIOSFODNN7EXAMPLE"
AWS_SECRET_ACCESS_KEY = "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"

# Generic GitHub token placeholder
GITHUB_TOKEN = "ghp_EXAMPLE_notarealtoken_0000000000000000000"  # intentional fixture secret

# Database connection with hardcoded password
DATABASE_URL = "postgresql://admin:password123@prod-db.example.com:5432/myapp"

# Hardcoded private key
RSA_PRIVATE_KEY = """-----BEGIN RSA PRIVATE KEY-----
MIIEowIBAAKCAQEA0Yd2fakekeyplaceholderneveruseinproduction1234567890
-----END RSA PRIVATE KEY-----"""


def connect():
    import psycopg2
    return psycopg2.connect(DATABASE_URL)
