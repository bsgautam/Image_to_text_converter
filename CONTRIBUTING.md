# Contributing

Thanks for considering a contribution! This project prefers small, focused pull requests that are easy to review.

## Pick a task
- Good first tasks: documentation clarifications, small UI tweaks, minor bug fixes, simple features (e.g., add a language option)
- Not sure where to start? Open an issue titled like “Proposal: Add batch mode toggle” with a short outline

## Workflow
1) Fork the repository and create a feature branch from `main`  
   Examples: `feat/batch-mode`, `fix/copy-toast`, `docs/contributing`

2) Make your change and self‑test locally  
   - Open `index.html` in a modern browser  
   - Verify upload, crop, OCR, copy/download, and any UI you changed

3) Write clear, present‑tense commits  
   Examples: “Add batch mode toggle”, “Fix cropper modal close state”

4) Open a Pull Request (PR)  
   - Use the PR template  
   - Include what/why, test steps, and screenshots/logs for UI/OCR output changes  
   - Link related issues with “Fixes #123” when applicable

5) Reviews  
   - Keep scope small for faster reviews  
   - Please respond to feedback promptly


## Scope and quality
- One focused change per PR; avoid unrelated edits
- Prefer clarity over cleverness; keep diffs minimal and readable
- For UI, ensure keyboard accessibility and sensible defaults

## Sample names
- Branches: `feat/language-selector`, `fix/clipboard-permission`, `docs/faq`
- Commits: “Add language dropdown and persist selection”, “Handle clipboard write errors with toast”, “Document local testing tips”

## Pull request checklist
- Small, single‑purpose scope
- Linked issue (if applicable)
- Docs updated if behavior changes (README or this file)
- Self‑tested locally; steps included in PR description
- Screenshots for UI/visual changes