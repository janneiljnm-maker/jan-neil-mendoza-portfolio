# Jan Neil Mendoza — Portfolio

A personal portfolio built with HTML, CSS, and vanilla JavaScript. It includes an introduction, projects, experience, education, skills, contact details, and a downloadable résumé.

The background uses the original 196 JPEG frames in `Pics/`. A canvas animation follows scrolling throughout the page and reaches its final frame at the footer, with eased motion and frame blending.

## Run locally

With Node.js installed, run this command from the project folder:

```sh
node server.mjs
```

Open [http://localhost:3000](http://localhost:3000). No package installation or build step is required. To use another port, run `node server.mjs 3001`.

On Windows, the included PowerShell launcher can also start the preview:

```powershell
.\serve.ps1
```

The launcher uses Node.js when available, otherwise it uses the runtime bundled with a standard per-user VS Code installation. Use `.\serve.ps1 -Port 3001` for another port. Stop the preview with `Ctrl+C`.

## Project files

- `index.html` — portfolio content and page structure.
- `styles.css` — responsive layout, colors, typography, and visual transitions.
- `animation.js` — scroll-driven frame loading, caching, and canvas rendering.
- `portfolio.js` — navigation, section reveals, email copying, and footer year.
- `Pics/` — the 196 animation frames, named `ezgif-frame-001.jpg` through `ezgif-frame-196.jpg`.
- `assets/` — local fonts, their license, and `jan-neil-mendoza-resume.pdf`.
- `server.mjs` — local preview server, bound to `127.0.0.1`.
- `serve.ps1` — Windows preview launcher.

Edit `index.html` to update the portfolio information. Replace `assets/jan-neil-mendoza-resume.pdf` to update the downloadable résumé. Font licensing information is in `assets/FONT-LICENSE.txt`.
