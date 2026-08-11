#!/bin/sh
# SSH push (no username/password). Add ~/.ssh/id_ed25519_github.pub to GitHub first.
env -u GIT_ASKPASS -u SSH_ASKPASS -u VSCODE_GIT_ASKPASS \
  -u VSCODE_GIT_ASKPASS_NODE -u VSCODE_GIT_ASKPASS_MAIN -u VSCODE_GIT_ASKPASS_EXTRA_ARGS \
  git push -u origin main
