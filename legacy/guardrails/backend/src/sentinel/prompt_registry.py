from __future__ import annotations

import yaml
from pathlib import Path
from typing import Any, Dict


class PromptNotFoundError(FileNotFoundError):
    pass


def load_prompt(version: str = "v1", base_path: str | Path | None = None) -> Dict[str, Any]:
    """Load a prompt configuration by version.

    Args:
        version: e.g. "v1" or "v2".
        base_path: directory containing prompt files; defaults to ./prompts relative to CWD.
    """
    base_dir = Path(base_path) if base_path else Path.cwd() / "prompts"
    file_path = base_dir / f"{version}.yaml"
    if not file_path.exists():
        raise PromptNotFoundError(file_path)
    with file_path.open("r", encoding="utf-8") as f:
        data = yaml.safe_load(f) or {}
    required_keys = {"system_message", "temperature", "model_name"}
    missing = required_keys - data.keys()
    if missing:
        raise ValueError(f"Prompt {file_path} missing keys: {', '.join(sorted(missing))}")
    return data

