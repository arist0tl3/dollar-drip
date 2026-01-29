# Agent Instructions

## Scope
- Keep changes minimal and focused.
- Prefer small, isolated commits.
- Avoid introducing new dependencies unless requested.

## Coding style
- Match existing patterns and naming.
- Use ASCII unless the file already uses Unicode.
- Add brief comments only where logic is non-obvious.

## Workflow
- Use `rg` for searching.
- Check `git status -sb` before and after changes.
- Summarize what changed and where.

## Safety
- Do not delete files unless explicitly requested.
- Do not run destructive commands (e.g. `git reset --hard`).
