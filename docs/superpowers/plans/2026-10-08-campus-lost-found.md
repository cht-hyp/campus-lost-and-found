# Campus Lost and Found Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans to implement this plan inline. Steps use checkbox syntax for tracking.

**Goal:** Build the approved offline, browser-local campus lost-and-found Web app and reproducible assignment materials.

**Architecture:** A single HTML entry uses hash navigation and classic scripts. Pure domain functions are shared between browser code and Node tests. A storage adapter persists one validated dataset before the UI changes.

**Tech Stack:** HTML, CSS, JavaScript, localStorage, Node >=22 node:test; no production dependencies.

**Spec:** docs/design.md; source assignment: requirement.md.

## Global Constraints

- Work in D:/SE homework/homework3.1; do not change homework3 or homework2.
- Chrome must open index.html directly, with no server, CDN or build step.
- Preserve blue/white cards, adapt to desktop and narrow screens.
- Browser-local owner identity only; no false claim of shared or authenticated accounts.
- Keep honest PSP, test, Git and collaboration evidence.

## Review Focus

- User text with HTML or quotes must remain inert text.
- Storage refusal, quota failure and corrupt content must not report success or destroy existing data.
- Browser Back/Forward with an unsaved form must preserve the form if navigation is cancelled.
- Completion must propagate across views and reload, and edits must retain completed status.
- file:// clipboard denial must leave contact text available for manual copying.

## Task 1: Domain and automated tests

Files: js/core.js, tests/core.test.cjs.
Interfaces: validatePost(input, now) -> errors; createPost(input, ownerId, options) -> Post; filterPosts(posts, filters) -> Post[]; editPost(post, input, ownerId, now) -> Post; resolvePost(post, ownerId, now) -> Post; statusLabel(post) -> string.

- [ ] Write tests with exact outcomes for valid lost/found input, required/whitespace/invalid/future values, search and intersecting filters, owner checks, terminal status and immutable edits.
- [ ] Run node --test tests/core.test.cjs; expect missing implementation failure.
- [ ] Implement functions with browser and CommonJS exports; run full suite; expect all pass.
- [ ] Commit verified domain implementation and tests.

## Task 2: Atomic browser persistence

Files: js/storage.js, tests/storage.test.cjs, js/seed.js.
Interfaces: createRepository(storage, options) -> {load(), save(state)}; state -> {version:1, ownerId, posts}.

- [ ] Write tests for initial seed, identity retention, roundtrip, unavailable storage, write failure, corrupt JSON/schema and malicious record types.
- [ ] Run full suite; expect missing repository failure.
- [ ] Implement non-destructive load and atomic save; add locally bundled demo records; run full suite; expect all pass.
- [ ] Commit verified persistence implementation and tests.

## Task 3: Responsive UI and hash flows

Files: index.html, css/styles.css, js/ui.js, js/views.js, js/app.js, tests/ui.test.cjs.
Consumes: Task 1 domain functions, Task 2 repository.
Produces: file:// application supporting home/search/publish/success/detail/mine/edit.

- [ ] Add safety and routing behavior tests before shared UI helpers; watch failures.
- [ ] Implement responsive blue/white cards, local illustrative SVGs, forms, filters, owner management, completion confirmation, copy fallback, toasts and unsaved navigation guard.
- [ ] Run full suite and JavaScript syntax checks; expect pass.
- [ ] Exercise actual Chrome at file:// for both post types, edit/resolve/reload, malicious text, back/cancel, copy denial, 390px and desktop layout; record screenshots and findings.
- [ ] Commit verified Web implementation.

## Task 4: Delivery and whole-project review

Files: README.md, docs/psp.md, docs/test-report.md, docs/blog-draft.md, docs/github-collaboration.md, artifacts/.

- [ ] Prepare truthful README, diagrams, PSP, test tutorial, blog draft, Git collaboration steps and actual screenshots.
- [ ] Run all unit tests with coverage, syntax checks, fresh-copy file:// smoke and whole-branch review.
- [ ] Fix important findings with RED→GREEN regression tests; commit passing delivery.
- [ ] Report local launch path, test evidence and any external-account requirements.
