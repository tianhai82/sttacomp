# Lessons Learned

<!--
Agent: read this at the start of each task during executing-tasks.
Follow every rule. Add new rules when you catch yourself making repeat mistakes.
Retire rules that no longer apply during finalizing.
-->

## Rules

- `$derived` and `$derived.by` must be used as variable declaration initializers (`let x = $derived(...)`), not as separate assignments. Svelte 5 will fail to build otherwise.
- Svelte 5 children/snippets must be rendered with `{@render children?.()}`, not `{children}`. The optional chaining handles cases where children is not passed.
- When upgrading Svelte 3→5, uninstalling a dependency (like svetamat) before removing its imports will break the build. Either remove imports first, or combine both in one commit.
- `svelte:component` is deprecated in Svelte 5 runes mode — use conditional `{#if}` blocks with direct component tags instead.
- Svelte 5 resolves to `index-server.js` (SSR) in non-browser environments. For component tests with `@testing-library/svelte`, add `resolve: { conditions: ['browser'] }` to `vite.config.js`.
- `@testing-library/svelte` with happy-dom doesn't auto-cleanup between tests. Add `afterEach(cleanup)` to each test file.
- Always verify migration edits actually saved by grepping for old patterns afterward — the edit tool can silently fail if oldText doesn't match exactly.
- Svelte 5 does not support event modifiers like `onclick|stopPropagation`. Use `onclick={(e) => { e.stopPropagation(); handler(); }}` instead.
