from sentinel.costs import estimate_cost


def test_estimate_cost_defaults_and_known_models():
    assert estimate_cost("gpt-4o-mini", 1000) == 0.0006
    assert estimate_cost("gpt-4o", 2000) == 0.006
    # unknown model should use fallback price 0.002 per 1k
    assert estimate_cost("unknown-model", 500) == 0.001
