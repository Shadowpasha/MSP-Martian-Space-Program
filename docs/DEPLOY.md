# Deploying the website

The website is one Docker image: the Node game server (`scripts/playtest.mjs`) serving the Estella web export
and the A.R.I.E.S. Gemini route. Anyone with write access to this repo can release it; any server can pull it.
Nothing about a particular server is written in the code: each server sets its own address, API key and limits
in a `.env` file.

```
PC: Estella export -> scripts/release.ps1 -> GitHub release on Shadowpasha/MSP-Martian-Space-Program
GitHub Actions (.github/workflows/release-image.yml) -> ghcr.io/shadowpasha/msp-martian-space-program
Server: .env + docker compose pull && docker compose up -d -> 127.0.0.1:8070 -> Cloudflare Tunnel (or a reverse proxy)
```

The examples below use `https://msp.example.com`. Use your own domain.

## Release (on your PC)

You need: Estella Editor, Git, and the GitHub CLI logged in (`gh auth login`) with write access to this repo.

1. Get the latest `main`:
   ```powershell
   git checkout main
   git pull origin main
   ```
2. In Estella: open the project, then **Build -> Package Project -> Web**, output folder `dist/web`.
   (Optional check: `npm.cmd run playtest`, then open http://127.0.0.1:4173/.)
3. In PowerShell from the repo folder, with a new version number each time:
   ```powershell
   .\scripts\release.ps1 v1.1.0 "What changed"
   ```
   It packs `dist/web` into `msp-web.tar.gz` and creates the release on `main`. The **Actions** tab shows
   "Release website image" building (about a minute).

**First release only:** the image package belongs to the repo owner. Shadowpasha opens
**github.com/Shadowpasha?tab=packages -> msp-martian-space-program -> Package settings** and sets the visibility
to **Public**, so servers can pull it without logging in.

## Server (once)

You need Docker with Compose 2.24 or newer (the install script below gives you that).

```bash
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER        # log out and back in after this
mkdir -p ~/msp && cd ~/msp
curl -fsSLO https://raw.githubusercontent.com/Shadowpasha/MSP-Martian-Space-Program/main/deploy/docker-compose.yml
curl -fsSL -o .env https://raw.githubusercontent.com/Shadowpasha/MSP-Martian-Space-Program/main/deploy/.env.example
chmod 600 .env
nano .env                            # set MSP_PUBLIC_URL and GEMINI_API_KEY (see below)
docker compose up -d
docker compose logs msp              # shows the public address and whether A.R.I.E.S. is ready
curl -I http://127.0.0.1:8070/       # 200 OK
```

Cloudflare (Zero Trust -> Networks -> Tunnels): add a public hostname for your domain that points at
`http://localhost:8070`. Turn **Rocket Loader** off for the site (Speed -> Optimization). The server needs no
open inbound ports except SSH. A reverse proxy such as Caddy or nginx works the same way.

### Settings (`~/msp/.env`)

| Setting | What it does |
|---|---|
| `MSP_PUBLIC_URL` | The address players open, for example `https://msp.example.com` (several: separate with commas). A.R.I.E.S. only answers pages opened from it. |
| `GEMINI_API_KEY` | Turns on live A.R.I.E.S. Leave it empty to use the built-in briefings only. |
| `GEMINI_MODEL` | Optional Gemini model (default `gemini-3-flash-preview`). |
| `MSP_AI_PER_MINUTE` | A.R.I.E.S. requests per player per minute (default 6). |
| `MSP_AI_PER_DAY` | A.R.I.E.S. requests per day for the whole server (default 300; `0` turns A.R.I.E.S. off). Protects your Gemini quota. |
| `MSP_HOST_PORT` | Port on the server for the tunnel (default 8070, on 127.0.0.1 only). |
| `MSP_IMAGE` | Optional: another image or a pinned release, for example `...:v1.0.0`. |

After changing `.env`: `docker compose up -d` (it recreates the container with the new settings).
The API key stays on the server: the browser only talks to `/api/gemini-plan` on the same site.

## Update the server after a release

```bash
cd ~/msp && docker compose pull && docker compose up -d
```

To roll back, set `MSP_IMAGE=ghcr.io/shadowpasha/msp-martian-space-program:v1.0.0` (an older release) in `.env`
and run `docker compose up -d`. Remove the line to go back to `:latest`.

## Troubleshooting

| Problem | Check |
|---|---|
| Action fails at "Unpack the web export" | The release has no `msp-web.tar.gz`: re-export to `dist/web` and release with a new version. |
| Action fails at "login" or "push" | Repo **Settings -> Actions -> General -> Workflow permissions** must allow read and write. |
| `docker compose pull`: unauthorized / denied | The package is not public yet (see *First release only*). |
| `docker compose`: "env_file ... path" is not allowed | Compose is older than 2.24: update Docker. |
| Cloudflare error 502 / 1033 | On the server: `docker ps`, `curl -I http://127.0.0.1:8070/`, `sudo systemctl status cloudflared`. |
| A.R.I.E.S. says "Open A.R.I.E.S. from the game" | `MSP_PUBLIC_URL` in `.env` does not match the address in the browser (check `https://`, no path). |
| A.R.I.E.S. stays on authored briefings | `docker compose logs msp` must say "A.R.I.E.S. ready". If not, `GEMINI_API_KEY` is empty or `MSP_AI_PER_DAY` is 0. |
| A.R.I.E.S. says "busy" or "today's limit" | The rate limits in `.env` were reached. Raise them if your Gemini quota allows. |
| The site shows an old version | `docker compose pull && docker compose up -d` again; purge the Cloudflare cache if needed. |

## Notes

- Files under `assets/` and `chunks/` have content-hashed names, so the server lets browsers and Cloudflare
  cache them for a year. `index.html`, `scripts.js` and the engine are revalidated, so a release shows at once.
- Player saves live in each browser, per address.
- No sound until the first click or key press: browsers start game audio only after the player interacts.
