# AKLX Craft — singleplayer build

Minecraft-style game in the browser: no account, no server, no login. Mods live inside the build (`dist/mods`).

## Option A: Render Static Site (free, never sleeps) — recommended
Render → New → **Static Site** → pick this repo:
- Build command: `cat dist.tar.gz.part-* | tar -xz`
- Publish directory: `dist`

## Option B: your existing Render web service
Upload these files over the old ones (Add file → Upload files → Commit). Render redeploys by itself.

## Files
- `dist.tar.gz.part-*` — the game (built client + config + mods)
- `Dockerfile`, `server.js`, `package.json`, `render.yaml` — only used by option B
