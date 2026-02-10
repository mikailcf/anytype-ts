# Ralph Agent Instructions

You are an autonomous coding agent working on a software project.

## Your Task

1. Read the PRD at `prd.json` (in the same directory as this file)
2. Read the progress log at `progress.txt` (check Codebase Patterns section first)
3. Check you're on the correct branch from PRD `branchName`. If not, check it out or create from main.
4. Pick the **highest priority** user story where `passes: false`
5. Implement that single user story
6. Run quality checks (e.g., typecheck, lint, test - use whatever your project requires)
7. Run **every** acceptance criterion — including browser verification if listed (see below)
8. Update CLAUDE.md files if you discover reusable patterns (see below)
9. If **all** checks pass (including browser), commit ALL changes with message: `feat: [Story ID] - [Story Title]`
10. Update the PRD to set `passes: true` for the completed story
11. Append your progress to `progress.txt`

## Progress Report Format

APPEND to progress.txt (never replace, always append):
```
## [Date/Time] - [Story ID]
- What was implemented
- Files changed
- **Learnings for future iterations:**
  - Patterns discovered (e.g., "this codebase uses X for Y")
  - Gotchas encountered (e.g., "don't forget to update Z when changing W")
  - Useful context (e.g., "the evaluation panel is in component X")
---
```

The learnings section is critical - it helps future iterations avoid repeating mistakes and understand the codebase better.

## Consolidate Patterns

If you discover a **reusable pattern** that future iterations should know, add it to the `## Codebase Patterns` section at the TOP of progress.txt (create it if it doesn't exist). This section should consolidate the most important learnings:

```
## Codebase Patterns
- Example: Use `sql<number>` template for aggregations
- Example: Always use `IF NOT EXISTS` for migrations
- Example: Export types from actions.ts for UI components
```

Only add patterns that are **general and reusable**, not story-specific details.

## Update CLAUDE.md Files

Before committing, check if any edited files have learnings worth preserving in nearby CLAUDE.md files:

1. **Identify directories with edited files** - Look at which directories you modified
2. **Check for existing CLAUDE.md** - Look for CLAUDE.md in those directories or parent directories
3. **Add valuable learnings** - If you discovered something future developers/agents should know:
   - API patterns or conventions specific to that module
   - Gotchas or non-obvious requirements
   - Dependencies between files
   - Testing approaches for that area
   - Configuration or environment requirements

**Examples of good CLAUDE.md additions:**
- "When modifying X, also update Y to keep them in sync"
- "This module uses pattern Z for all API calls"
- "Tests require the dev server running on PORT 3000"
- "Field names must match the template exactly"

**Do NOT add:**
- Story-specific implementation details
- Temporary debugging notes
- Information already in progress.txt

Only update CLAUDE.md if you have **genuinely reusable knowledge** that would help future work in that directory.

## Quality Requirements

- ALL commits must pass your project's quality checks (typecheck, lint, test)
- **NEVER mark a story as passing if you skipped a required acceptance criterion** — if a criterion cannot be verified, document why and leave `passes: false`
- Do NOT commit broken code
- Keep changes focused and minimal
- Follow existing code patterns

## Browser Testing is MANDATORY When Listed

If **any** acceptance criterion says "Verify in browser", this is a **blocking gate** — not optional.

**You MUST NOT mark a story as `passes: true` until browser verification is complete.**

### Steps
1. Start the servers and connect to Electron (steps can be found on CLAUDE.md)
2. Verify the UI renders correctly — take a snapshot or screenshot as evidence
3. Check browser console for runtime errors (`browser_console_messages`)
4. Document the result (pass or fail) in your progress report

### If servers cannot be started
- Document the specific blocker (missing binary, port conflict, crash, etc.)
- Leave `passes: false` in the PRD
- Note in progress.txt what was completed and what remains
- Do NOT skip the criterion and mark as passing anyway

### Why this matters
Static checks (typecheck, lint) catch compile-time issues. Browser testing catches:
- Runtime errors from missing props, broken imports, or bad state
- Rendering issues (empty pages, broken layouts, missing text)
- Navigation failures (dead links, broken routes)
- Regressions in surrounding UI caused by the change

## Stop Condition

After completing a user story, check if ALL stories have `passes: true`.

If ALL stories are complete and passing, reply with:
<promise>COMPLETE</promise>

If there are still stories with `passes: false`, end your response normally (another iteration will pick up the next story).

## Important

- Work on ONE story per iteration
- Commit frequently
- Keep CI green
- Read the Codebase Patterns section in progress.txt before starting
