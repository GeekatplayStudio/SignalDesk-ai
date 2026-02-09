from pathlib import Path

from sentinel.eval_engine import run_eval


def test_run_eval_with_sample_goldens():
    repo_root = Path(__file__).resolve().parents[2]
    goldens = repo_root / "data" / "goldens"
    prompts_path = repo_root / "prompts"

    eval_run = run_eval(goldens, prompt_version="v1", agent_version="test", prompts_path=prompts_path)

    assert eval_run.total_tests == 3
    assert eval_run.passed == 3
    assert eval_run.pass_rate == 100.0
    assert eval_run.total_cost >= 0
