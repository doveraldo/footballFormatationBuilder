# Pittwater RSL FC — Formation Builder

Simple HTML app to arrange a soccer formation. Features:

- Drag players from the substitutes list onto the pitch slots.
- 11 pitch slots (1 GK + 10 outfield). Any players not on the pitch remain in substitutes.
- Save and restore formation using `localStorage`.

Setup

1. Put the club logo image at `assets/pittwater-logo.png` (used as pitch background). If you don't have it, replace or remove the background CSS.
2. Open `index.html` in a browser.

Notes

- Club colours are set in `styles.css` via CSS variables `--club-primary` and `--club-accent`.
- To prefill players into slots programmatically, modify `app.js`.
