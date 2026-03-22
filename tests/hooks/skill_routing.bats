#!/usr/bin/env bats
# Tests for skill-routing.sh — verifies keyword → skill routing decisions.

HOOK="$BATS_TEST_DIRNAME/../../hooks/skill-routing.sh"

run_hook() {
  echo "$1" | bash "$HOOK"
}

@test "bug keyword routes to fix-bug hint" {
  run run_hook '{"user_prompt":"there is a bug in the auth handler"}'
  [ "$status" -eq 0 ]
  [[ "$output" =~ "fix-bug" ]]
}

@test "non-routing prompt: hook exits 0 with no output" {
  run run_hook '{"user_prompt":"summarize this file for me"}'
  [ "$status" -eq 0 ]
  [ "$output" = "" ]
}

@test "empty prompt: hook exits 0 without crashing" {
  run run_hook '{"user_prompt":""}'
  [ "$status" -eq 0 ]
}

@test "malformed json: hook exits 0 without crashing" {
  run run_hook 'not json at all'
  [ "$status" -eq 0 ]
}
