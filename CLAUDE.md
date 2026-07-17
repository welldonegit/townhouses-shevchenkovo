# Project Rules

This is a website refactoring project.

## Main goal

Refactor the current exported design into a clean, maintainable project structure.

## Important rules

- Do not change the visual design unless explicitly requested.
- Preserve all existing text content.
- Preserve layout and responsive behavior.
- Separate markup, styles, and logic.
- Keep code readable and modular.
- Do not add unnecessary frameworks.
- Do not add backend integrations until the frontend structure is clean.
- Do not store secrets in frontend files.
- Do not create or edit files outside the project workspace.
- Before large changes, explain the plan.
- After changes, summarize exactly what files were changed.

## Preferred structure

- HTML markup should be clean and semantic.
- CSS should be split by purpose.
- JavaScript should be split into modules.
- Form logic should be separate from UI interactions.
- API integration should go through backend endpoints only.

## Development commands

npm install
npm run dev
npm run build

## Security

Never put Telegram bot tokens, payment API keys, private keys, SSH keys, or production credentials into client-side code.
