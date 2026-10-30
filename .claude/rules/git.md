# Git Rules

- Preserve all existing user changes and inspect the worktree before editing or staging.
- Keep the diff limited to the approved task; do not reset, clean, or overwrite user work.
- Never push. Obtain explicit human approval before creating branches, committing, or otherwise publishing changes. Approval to commit never authorizes a push.
- Before an approved commit, inspect staged paths and diff, scan for secrets and generated/local state, and run the relevant checks.
- Never commit credentials, private keys, environment files, generated output, or local state.
