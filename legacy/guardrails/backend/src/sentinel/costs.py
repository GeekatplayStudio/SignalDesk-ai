from __future__ import annotations

PRICE_PER_1K = {
    "gpt-4o-mini": 0.0006,
    "gpt-4o": 0.003,
    "gpt-4-turbo": 0.01,
}


def estimate_cost(model_name: str, token_count: int) -> float:
    """Rudimentary cost calculator using flat per-1k pricing."""
    price = PRICE_PER_1K.get(model_name, 0.002)
    return round((token_count / 1000) * price, 6)

