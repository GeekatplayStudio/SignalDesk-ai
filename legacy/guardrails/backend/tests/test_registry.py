import pytest
from sentinel.prompt_registry import load_prompt, PromptNotFoundError


def test_load_prompt_v1(tmp_path, monkeypatch):
    prompts_dir = tmp_path / "prompts"
    prompts_dir.mkdir()
    (prompts_dir / "v1.yaml").write_text(
        "system_message: test\ntemperature: 0.1\nmodel_name: demo\n"
    )
    prompt = load_prompt("v1", base_path=prompts_dir)
    assert prompt["system_message"] == "test"
    assert prompt["temperature"] == 0.1
    assert prompt["model_name"] == "demo"


def test_missing_prompt_raises():
    with pytest.raises(PromptNotFoundError):
        load_prompt("vX", base_path="/tmp/nonexistent")
