---
name: release
description: Runs the agent-provider-pool release process end-to-end (version bump, CHANGELOG, tag, GitHub Release, back-merge). User-invoked only — e.g. "start the release", "cut vX.Y.Z".
---

# Release — agent-provider-pool

Deterministic process — follow the steps in order. No step requires
architectural judgment; if something doesn't match what's expected, stop
and ask instead of improvising.

Adapted from `fitness-web`'s `release` skill, stripped of everything
specific to that project (two `package.json` files, Render/Vercel deploy on
merge, GitHub Actions guard workflows, in-app announcement endpoint) — this
repo has none of that. **No GitHub Actions here at all** (deliberate — see
`BACKLOG.md` Story 1.3): quality gate is `make check`, run locally, never a
CI workflow to wait on.

**Golden rule: never `git stash` to unblock the pre-push hook.** The whole
process runs in an isolated `git worktree` — the user's active working
tree/branch is never touched. If something blocks the push anyway, stop and
ask; don't stash on the main working tree.

This package is not yet published to the npm registry. **`npm publish` is
never part of this skill** — it's a separate, explicit, user-confirmed
action (irreversible-ish: an unpublish window on npm is only 72 hours). This
skill's "release" means: a tagged, documented version on GitHub.

## 1. Pre-check

```bash
git fetch origin
ULTIMA_TAG=$(git tag --sort=-creatordate | head -1)  # empty string on the very first release
git show origin/develop:package.json | grep '"version"'
```

The release version is whatever `origin/develop`'s `package.json` already
says — never chosen by hand. If a tag already exists matching that version,
the previous release didn't bump `develop` to the next dev version — stop
and investigate before continuing.

## 2. Isolated worktree

```bash
WT=/tmp/claude-release-agent-provider-pool-vX.Y.Z   # scratch path, outside the repo
git worktree add "$WT" -b release/vX.Y.Z origin/develop
cd "$WT"
```

Every step from here to cleanup (step 15) runs inside `$WT`, never on the
original working tree.

## 3. Confirm the version (no bump needed on a normal release)

This project doesn't use a `-SNAPSHOT`/pre-release suffix in `package.json`
— the version on `develop` at any time is already the version the *next*
release will ship (see step 14 for why). Just confirm `package.json`'s
`version` field is the version you're about to tag; no edit needed here.

## 4. CHANGELOG

For a small commit window (roughly under ~15 commits since the last tag —
true for early releases of this project), read the log directly instead of
delegating to a subagent:

```bash
git log $ULTIMA_TAG..origin/develop --no-merges --format='%s' | grep -E '^(feat|fix)'
```

`docs`/`chore`/`refactor`/`test`-only commits don't get their own bullet
(same policy as `fitness-web`) unless they're the *only* content of the
window. Curate by theme, not one bullet per commit. Format — [Keep a
Changelog](https://keepachangelog.com/):

```markdown
## [X.Y.Z] - YYYY-MM-DD

### Added
- ...

### Fixed
- ...
```

(Only the sections that have content.) Insert above the previous entry in
`CHANGELOG.md` — create the file with this as its first entry if it doesn't
exist yet.

**If the commit window grows large in a later release** (a real multi-week
window with dozens of commits), switch to delegating the curation to a
disposable Sonnet subagent instead of reading it all in the main session —
same rationale as `fitness-web`'s version of this skill: don't let a big
`git log` bloat this session's context.

## 5. Validate before proceeding

```bash
make check
```

This runs lint + type-check + unit tests (see `Makefile`) — must pass
clean. There's no separate "build produces what deploy needs" concern here
(no deploy); this is just the same gate every PR already has to pass.

## 6. Explicit commit

```bash
git add CHANGELOG.md
git commit -m "chore(release): vX.Y.Z

<3-5 line summary of the main themes, same tone as previous releases —
see 'git show --stat <previous-release-hash>' once one exists>"
```

Never `git add -A` — only `CHANGELOG.md` (plus `package.json` if step 3
ever does need an edit on a future release where the convention changes).

## 7. Push

```bash
git push -u origin release/vX.Y.Z
```

## 8. Open the PR

```bash
gh pr create --repo murilofelipe/agent-provider-pool \
  --base main --head release/vX.Y.Z \
  --title "chore(release): vX.Y.Z" \
  --body "..."
```

`--base main` always explicit.

## 9. No CI checks to wait for

Unlike `fitness-web`, there is no GitHub Actions workflow gating this PR —
`make check` already ran clean locally in step 5 (and again automatically
via the pre-push hook in step 7). Nothing to poll here.

## 10. Confirm with the user before merge

**Stop here and use `AskUserQuestion`.** Merging to `main` marks the code
as released — ask for explicit confirmation even if the user already asked
to "start the release" earlier. General authorization doesn't cover this
specific, harder-to-undo action on a public repo.

## 11. Merge

```bash
gh pr merge <pr-number> --repo murilofelipe/agent-provider-pool --merge --delete-branch=false
```

Release branches aren't deleted (same precedent as `fitness-web`).

## 12. Tag — always on `origin/main`, never local `main`

**Stop and confirm with `AskUserQuestion` again before pushing the tag** —
same class of hard-to-undo action as the merge.

```bash
git fetch origin
git tag vX.Y.Z origin/main
git push origin vX.Y.Z
```

## 13. GitHub Release

```bash
gh release create vX.Y.Z --repo murilofelipe/agent-provider-pool \
  --title "vX.Y.Z" \
  --notes-file <path to just the new CHANGELOG section, extracted to a temp file>
```

This is the public-facing artifact for an OSS repo — makes the release
visible on the repo's Releases page without requiring anyone to read
`CHANGELOG.md` directly. Low-risk, doesn't trigger anything further, no
extra confirmation needed beyond the tag confirmation in step 12.

## 14. Back-merge `main` → `develop`

```bash
git -C "$WT" fetch origin
git -C "$WT" checkout -B develop origin/develop
git -C "$WT" merge origin/main
git -C "$WT" push origin develop
```

If this conflicts on `CHANGELOG.md`, it's almost certainly a sign a
*previous* release skipped this back-merge — investigate the root cause
before just resolving the conflict mechanically.

## 15. Bump `develop` to the next dev version

Edit `package.json` to the next `X.(Y+1).0` (next MINOR — this package
isn't at 1.0.0 yet, so breaking changes still bump MINOR per semver's
0.y.z rule; switch to bumping MAJOR once the package reaches 1.0.0).

```bash
git add package.json
git commit -m "chore: bump to X.(Y+1).0 for the next development cycle"
git push origin develop
```

## 16. Cleanup

```bash
git worktree remove "$WT" --force
```

## 17. Report to the user

Version released, PR link, tag pushed, GitHub Release link, `develop` now
on the next version. Explicitly note that **`npm publish` was not run** —
that remains a separate, deliberate step whenever the user decides this
package is ready to be publicly installable.
