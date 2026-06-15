#!/bin/bash
set -e
pnpm install --frozen-lockfile
pnpm --filter db push

# Auto-push to GitHub on every checkpoint
if [ -n "$GITHUB_TOKEN" ]; then
  git config credential.helper store
  echo "https://x-access-token:${GITHUB_TOKEN}@github.com" > ~/.git-credentials
  chmod 600 ~/.git-credentials

  if ! git remote get-url origin &>/dev/null; then
    git remote add origin https://github.com/rodlife1314-star/governance.git
  fi

  git push --force origin main
else
  echo "GITHUB_TOKEN not set — skipping GitHub push" >&2
fi
