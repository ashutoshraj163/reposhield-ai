"""
Tests for the BharatCode AI service.
These run without a real API key — they verify fallback behavior,
input sanitization, and schema validation.
"""
import asyncio
import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import pytest
from schemas import AIExplanation, Finding
from services.bharatcode import (
    _build_explain_payload,
    _fallback_explanation,
    _parse_and_validate,
    _redact_secrets,
)

SAMPLE_FINDING = Finding(
    id="finding-test001",
    rule_id="python.lang.security.audit.subprocess-shell-true.subprocess-shell-true",
    category="injection",
    severity="high",
    file="app.py",
    line=14,
    message="subprocess with shell=True is dangerous",
    code_excerpt="subprocess.run(user_input, shell=True)",
    source="semgrep",
)


def test_fallback_returns_valid_explanation():
    result = _fallback_explanation(SAMPLE_FINDING)
    assert isinstance(result, AIExplanation)
    assert result.fallback is True
    assert result.confidence == "low"
    assert result.ai_model == "fallback"
    assert SAMPLE_FINDING.rule_id in result.summary


def test_build_payload_redacts_secrets():
    secret_finding = SAMPLE_FINDING.model_copy(update={
        "code_excerpt": 'api_key = "sk-prod-abcdef1234567890abc"'
    })
    payload = _build_explain_payload(secret_finding)
    assert "sk-prod" not in payload["code_excerpt"]
    assert "[REDACTED]" in payload["code_excerpt"]


def test_redact_aws_key():
    text = 'key = "AKIAIOSFODNN7EXAMPLE"'
    result = _redact_secrets(text)
    assert "AKIA" not in result
    assert "[REDACTED]" in result


def test_redact_github_token():
    text = 'token = "ghp_16C7e42F292c6912E7710c838347Ae298V5"'
    result = _redact_secrets(text)
    assert "ghp_" not in result


def test_parse_valid_json_response():
    raw = '''{"summary": "OS command injection via shell=True",
              "impact": "Attacker can run arbitrary commands",
              "confidence": "high",
              "remediation": "Use shell=False and pass args as a list",
              "patch": "subprocess.run(['ls', '-la'], shell=False)",
              "verification_steps": ["Re-run semgrep scan"],
              "beginner_tip": "Never pass user input to shell commands"}'''
    result = _parse_and_validate(raw, SAMPLE_FINDING, "qwen-3.8-27b")
    assert isinstance(result, AIExplanation)
    assert result.fallback is False
    assert result.confidence == "high"
    assert result.patch is not None


def test_parse_json_with_markdown_fences():
    raw = '```json\n{"summary":"test","impact":"test","confidence":"medium","remediation":"fix it"}\n```'
    result = _parse_and_validate(raw, SAMPLE_FINDING, "test-model")
    assert result.summary == "test"
    assert result.fallback is False


def test_parse_invalid_json_falls_back():
    result = _parse_and_validate("not json at all", SAMPLE_FINDING, "test-model")
    assert result.fallback is True


def test_parse_wrong_confidence_value_falls_back():
    raw = '{"summary":"s","impact":"i","confidence":"EXTREME","remediation":"r"}'
    result = _parse_and_validate(raw, SAMPLE_FINDING, "test-model")
    assert result.fallback is True


def test_explain_without_api_key_returns_fallback():
    original = os.environ.pop("BHARATCODE_API_KEY", None)
    # Reset module-level client
    import services.bharatcode as svc
    svc._client = None
    try:
        result = asyncio.run(svc.explain_finding(SAMPLE_FINDING))
        assert result.fallback is True
    finally:
        if original:
            os.environ["BHARATCODE_API_KEY"] = original
        svc._client = None
