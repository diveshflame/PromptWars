# CLAUDE.md

Behavioral guidelines to reduce common LLM coding mistakes. Merge with project-specific instructions as needed.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

---

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.
----

# Project Instructions — Competition Build

## Task-size calibration (important)
Superpowers' clarify → design → plan → code → verify cycle should scale to the size of the request:
- **Large tasks** (initial scaffold, new feature, architecture decisions): run the full cycle.
- **Small tasks** (styling tweaks, copy changes, quick bug fixes, follow-up iterations): skip clarification and verification ceremony by default. Make the change directly and concisely. Only ask a clarifying question if the request is genuinely ambiguous in a way that would produce the wrong result.
- If a small, low-ambiguity change is taking more than ~5 minutes, stop and simplify the approach rather than continuing to elaborate.

## Known gotchas — handle proactively, don't wait to be asked
1. **Supabase RLS is on by default.** Whenever creating or writing to a table, explicitly set and state the RLS policy applied (or confirm RLS is disabled for test purposes). Never leave this unstated.
2. **Vercel env vars do not carry over from `.env.local`.** After adding any new environment variable, remind me it also needs to be added in the Vercel dashboard or via `vercel env add`, and that a redeploy is required for it to take effect.
3. **Vercel Deployment Protection can block public access.** Before considering a deploy "done," note that Deployment Protection should be checked/disabled so the live URL is publicly accessible without login.
4. **Persona/role-play framing in prompts has little effect on your behavior** — don't rely on it; follow the explicit constraints given instead.

## Priorities (this app is judged on, in this order of importance)
1. **Functionality working** — a live app with no errors beats a feature-rich but broken one. Verify core flows work end-to-end before polishing anything else.
2. **Testing** — include at least basic tests for core logic; use Playwright for E2E verification of the main user flow before considering a feature done.
3. **Code structure** — keep modular, conventional folder structure (`components/`, `lib/`, `api/` etc.). Don't let structure degrade silently during quick fixes — if asked for a "structure review," treat it as its own task worth the full ceremony.
4. **UI** — use the Frontend Design plugin's guidance; avoid generic/templated styling. Only prioritize this after 1–3 are solid.

## Deploy behavior
- Never run `vercel --prod` without explicit confirmation from me first.
- When proposing a production deploy, remind me to check the live URL in an incognito window afterward to confirm public accessibility.

NOTE :
When told something is lower priority or to minimize effort on it, always still include a minimal working version — never interpret deprioritization as omission.