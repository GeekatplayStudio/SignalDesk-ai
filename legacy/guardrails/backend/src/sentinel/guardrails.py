from __future__ import annotations

import re
from dataclasses import dataclass
from typing import List


EMAIL_PATTERN = re.compile(r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}")
PHONE_PATTERN = re.compile(r"\b(?:\+?1[-.\s]?)?(?:\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}\b")
FORBIDDEN_KEYWORDS = (
    "ignore instructions",
    "system prompt",
    "hotwire a car",
    "bypass safety",
    "jailbreak",
)
FORBIDDEN_OUTPUT_WORDS = ("bomb", "weaponized", "kill switch")
URL_PATTERN = re.compile(r"https?://[\w./-]+", re.IGNORECASE)


@dataclass
class GuardrailResult:
    sanitized_text: str
    triggered: List[str]


class SafetyFilter:
    """Input/output guardrails for the Sentinel platform."""

    def sanitize_input(self, text: str) -> GuardrailResult:
        triggered: List[str] = []
        sanitized = EMAIL_PATTERN.sub("[REDACTED_EMAIL]", text)
        if sanitized != text:
            triggered.append("PII_EMAIL")
            text = sanitized

        sanitized = PHONE_PATTERN.sub("[REDACTED_PHONE]", text)
        if sanitized != text:
            triggered.append("PII_PHONE")

        return GuardrailResult(sanitized_text=sanitized, triggered=triggered)

    def check_policy(self, text: str) -> List[str]:
        policy_hits = [k for k in FORBIDDEN_KEYWORDS if k.lower() in text.lower()]
        return [f"POLICY_{k.upper().replace(' ', '_')}" for k in policy_hits]

    def scan_output(self, text: str) -> List[str]:
        hits: List[str] = []
        for word in FORBIDDEN_OUTPUT_WORDS:
            if word.lower() in text.lower():
                hits.append(f"FORBIDDEN_WORD:{word}")

        urls = URL_PATTERN.findall(text)
        for url in urls:
            if url.endswith("404") or "doesnotexist" in url or "invalid" in url:
                hits.append("URL_404")
        return hits

    def filter_input(self, text: str) -> GuardrailResult:
        """Sanitize PII and flag policy violations on input."""
        pii_result = self.sanitize_input(text)
        policy = self.check_policy(pii_result.sanitized_text)
        return GuardrailResult(
            sanitized_text=pii_result.sanitized_text,
            triggered=pii_result.triggered + policy,
        )

    def filter_output(self, text: str) -> GuardrailResult:
        hits = self.scan_output(text)
        return GuardrailResult(sanitized_text=text, triggered=hits)

