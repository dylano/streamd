---
name: add-feature
description: Use when the user wants to add/implement a feature in StreamD and have the full release workflow handled — branch check, implementation, version bump, and doc updates (CLAUDE.md + README release notes). Trigger on requests like "add a feature", "implement X", "let's build X feature", or "/add-feature".
---

# Add Feature

Drives a feature from idea to release-ready, including versioning and docs. Work through the steps in order. Don't skip the gates — they exist because they were missed before.

## 1. Branch check

Ask the user: **"Do you need a new branch for this feature?"** (Don't assume — they may already be on the right one.)

If yes, create it cleanly off the latest `main`:

1. `git fetch origin`
2. Confirm where the current branch sits relative to `origin/main` (`git rev-list --left-right --count main...origin/main`) and check whether any uncommitted work is already staged.
3. If there are staged/working changes that belong to this feature, branch off `origin/main` so they carry over: `git checkout origin/main -b <feature-branch>`. The changes move with you as long as the touched files are identical between the old base and `origin/main` (verify with `git diff --name-only HEAD origin/main -- <files>` — empty means zero conflict risk).
4. Sync local `main` without checking it out: `git branch -f main origin/main`.
5. Clear the accidental upstream so a later push doesn't target main: `git branch --unset-upstream` (on the new branch). The user will push with `git push -u origin <feature-branch>`.

Pick a short, descriptive kebab-case branch name (e.g. `show-swipes`).

## 2. Implement the feature

- Read `CLAUDE.md` first (via the Read tool) and follow its conventions — hooks in `src/hooks/`, shared UI in `src/components/ui/`, `Intl` for dates, `vite-plus/test` for tests, etc.
- **Write tests** for the new behavior and update any existing tests your change invalidates.
- Validate before considering the work done:
  - `npm run build` (full type-check — `tsc --noEmit` skips `src/test/`, so this is the real gate)
  - `npm run test:run` (or scope to the relevant files)
- Both must pass. Report failures honestly with output.

## 3. Bump the version

Ask the user: **"Is this a major, minor, or patch release?"** Then bump `version` in `package.json` accordingly (semver: major = breaking, minor = new feature, patch = fix/small change).

## 4. Update CLAUDE.md

Update `CLAUDE.md` only where the change affects documented architecture, conventions, or behavior (e.g. a navigation pattern, a new endpoint, a data-model change). If a documented behavior is now inaccurate, correct it. If nothing documented changed, leave it alone — don't pad it.

## 5. Update README

- Add a new release-notes entry at the **top** of the `## Release Notes` section matching the new version number, describing the user-facing change.
- Fix any **current** prose elsewhere in the README that the feature made inaccurate.
- **Never edit older version entries in the changelog** — they are a historical record and were true at the time. Only add the new entry.

## 6. Wrap up

Summarize what changed (files, version, docs, tests) and the branch state. Leave changes staged/uncommitted unless the user asks to commit or push — and confirm before any push, since that's outward-facing.
