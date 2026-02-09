# Contributing

## Branch and PR Process
1. Create a feature branch.
2. Implement changes with tests.
3. Run local quality gates:
   - `make test-api`
   - `make test-web`
4. Open PR with:
   - problem statement
   - approach
   - test evidence
   - rollout/rollback notes

## Code Standards
- Keep API changes backward-compatible unless versioned.
- Add tests for behavior changes in orchestration, tools, or safety paths.
- Update docs in `docs/` for architecture or workflow changes.

## Commit Scope
- Keep commits focused and atomic.
- Avoid mixing pure refactors with behavior changes when possible.
