# CLAUDE.md — crew-center-IOS

This repo is small (33 tracked files), so the cost here is rarely reading — it
is rewriting whole files and over-explaining in chat.

## Reading

Largest text files: `assets/brand.css` (~1,140), `README.md` (~440),
`index.html` (~436), `assets/js/site.js` (~320). These are fine to Read whole
when the change actually spans the file.

Never read `assets/img/*.webp` or `*.svg` — binary or machine-generated.

For anything over ~800 lines: Grep for the selector or symbol first, then Read
a window with `offset`/`limit`.

## Editing

- Use Edit on existing files. Never Write a whole file to change part of it —
  rewriting `assets/brand.css` to change one rule costs ~1,140 lines of output.
- Do not re-read a file to verify an edit landed. Edit fails loudly if the
  match was wrong; silence means it worked.
- Batch independent tool calls into one block rather than one per turn.

## Finding code

1. Grep with `output_mode: "files_with_matches"` to locate.
2. Grep with `output_mode: "content"` and `-C 5` to confirm.
3. Read only the confirmed range.

Because the HTML pages share `assets/brand.css` and `assets/js/site.js`, Grep
across `*.html` before assuming a change is page-local.

## Verifying

Run the narrowest check that proves the change. Use `git diff --stat` before
`git diff`. Prefer `git diff -- <path>` over the whole working tree.

## Responses

- Lead with the answer or the result. No preamble, no "Great question!", no
  closing summary of what was just done.
- Never paste back code that was just written or edited — reference it as
  `assets/js/site.js:88`.
- Report file contents by reference, not by quoting the file into chat.
- State a recommendation instead of enumerating every option considered.
- If a requirement is genuinely ambiguous, ask once before building — a wrong
  build and its rewrite cost far more than the question.

## Subagents

Do not spawn subagents unless explicitly asked. Each one starts cold and
re-derives context this session already holds, which multiplies token use
rather than saving it.
