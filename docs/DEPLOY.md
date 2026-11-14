# Deploying the website (msp.amerai.top)

The game is a static website: an nginx Docker image serving the Estella web export. Anyone with write
access to this repo can release it; the server pulls the new image. Cloudflare Tunnel serves
`https://msp.amerai.top` from `localhost:8070` on the server.

```
PC: Estella export -> scripts/release.ps1 -> GitHub release on Shadowpasha/MSP-Martian-Space-Program
GitHub Actions (.github/workflows/release-image.yml) -> ghcr.io/shadowpasha/msp-martian-space-program
Server: docker compose pull && docker compose up -d -> 127.0.0.1:8070 -> Cloudflare Tunnel
```

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
   .\scripts\release.ps1 v1.0.0 "What changed"
   ```
   It packs `dist/web` into `msp-web.tar.gz` and creates the release on `main`. The **Actions** tab shows
   "Release website image" building (about a minute).

**First release only:** the image package belongs to the repo owner. Shadowpasha opens
**github.com/Shadowpasha?tab=packages -> msp-martian-space-program -> Package settings** and sets the visibility
to **Public**, so the server can pull it without logging in.

## Server (once)

```bash
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER        # log out and back in after this
mkdir -p ~/msp && cd ~/msp
curl -fsSLO https://raw.githubusercontent.com/Shadowpasha/MSP-Martian-Space-Program/main/deploy/docker-compose.yml
docker compose up -d
curl -I http://127.0.0.1:8070/       # 200 OK
```

Cloudflare (Zero Trust -> Networks -> Tunnels): the tunnel's public hostname `msp.amerai.top` points at
`http://localhost:8070`. Turn **Rocket Loader** off for the site (Speed -> Optimization). The server needs no
open inbound ports except SSH.

## Update the server after a release

```bash
cd ~/msp && docker compose pull && docker compose up -d
```

To roll back, change `:latest` in `~/msp/docker-compose.yml` to an older release (for example `:v1.0.0`) and run
`docker compose up -d`.

## Troubleshooting

| Problem | Check |
|---|---|
| Action fails at "Unpack the web export" | The release has no `msp-web.tar.gz`: re-export to `dist/web` and release with a new version. |
| Action fails at "login" or "push" | Repo **Settings -> Actions -> General -> Workflow permissions** must allow read and write. |
| `docker compose pull`: unauthorized / denied | The package is not public yet (see *First release only*). |
| Cloudflare error 502 / 1033 | On the server: `docker ps`, `curl -I http://127.0.0.1:8070/`, `sudo systemctl status cloudflared`. |
| The site shows an old version | `docker compose pull && docker compose up -d` again; purge the Cloudflare cache if needed. |

## Notes

- A.R.I.E.S. uses its authored briefings on the website. Live Gemini only runs on `localhost` through
  `npm run playtest`, which keeps the API key off the internet.
- Player saves live in each browser, per address (`https://msp.amerai.top`).
- No sound until the first click or key press: browsers start game audio only after the player interacts.
