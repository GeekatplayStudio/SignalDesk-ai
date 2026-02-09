from __future__ import annotations

from pathlib import Path
import typer

from .eval_engine import run_eval, write_report, print_summary

app = typer.Typer(help="Sentinel – eval runner & guardrails")


@app.command()
def run_evals(
    goldens: Path = typer.Option(
        Path("data/goldens"),
        help="Folder containing golden conversation YAML files",
        exists=True,
    ),
    prompt: str = typer.Option("v1", help="Prompt version to load (e.g., v1, v2)"),
    prompts_path: Path = typer.Option(Path("prompts"), help="Directory containing prompts"),
    agent_version: str = typer.Option("dev", help="Agent version label to include in report"),
    report: Path = typer.Option(Path("report.json"), help="Where to write JSON report"),
):
    """Run offline evaluations using golden datasets."""
    eval_run = run_eval(goldens, prompt_version=prompt, agent_version=agent_version, prompts_path=prompts_path)
    write_report(eval_run, report)
    print_summary(eval_run)


@app.command()
def version():
    from . import __version__

    typer.echo(__version__)


if __name__ == "__main__":
    app()
