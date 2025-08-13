# FastAPI × React Microfrontends with OpenTelemetry

**TL;DR**

```bash
pip install -r requirements.txt
python app.py
```

- Add your markdown docs to the frontend and reference them from `index.html` to view them in the UI.
- OpenAPI/Swagger lives at **`/docs`**.

---

## Live Demos

- **PayPal sample app:** [https://paypal.exotrend.live/](https://paypal.exotrend.live/)

- **SigNoz dashboard:** [Online SigNoz](https://s4z.exotrend.live/)

---

## What changed in the frontend (migration notes)

We replaced the legacy HTML/Custom Elements app with **Vite + React**, retained **PayPal Checkout**, and wired up **OpenTelemetry Web**. The React production build goes to `frontend/dist` and is served by **FastAPI**. Browser traces are shipped through a **same-origin OTLP proxy** at `/otel/v1/traces`, which the backend forwards to `http://10.172.27.45:4318`. This design sidesteps CORS and mixed-content problems, and it plays nicely with Cloudflared.

**Key bits**

- React components: `Year`, `PayPalButton`, `MarkdownToHtml`
- Auto-instrumentation for page load, clicks, fetch/XHR
- FastAPI proxy → OTLP collector (`http://10.172.27.45:4318`)
- Public exposure via a **Cloudflared** named tunnel

## Running it locally

### Backend (FastAPI)

```bash
# optional: create a venv (see "Python venv" below)
python3 -m venv .venv
source .venv/bin/activate

pip install -r requirements.txt
uvicorn app:app --host 0.0.0.0 --port 8080
```

### Frontend (React)

```bash
cd frontend
npm install
npm run dev      # dev server on 5173
npm run build    # production build -> frontend/dist
```

The backend serves the built React app at `/` and exposes these endpoints:

- `GET /clientid`
- `POST /orders`
- `POST /capture/{order_id}`
- `POST /otel/v1/traces` → proxies to the OTLP collector

---

## Keep it running (screen)

Install and use **screen** so your server persists after disconnect:

```bash
sudo apt update && sudo apt install -y screen
screen -S fastapi
# inside screen:
cd /path/to/INFO8589-S25-G3-INCLASS-TASK5
source .venv/bin/activate
uvicorn app:app --host 0.0.0.0 --port 8080
# detach with Ctrl+A, then D
# list: screen -ls | reattach: screen -r fastapi | kill: screen -XS fastapi quit
```

---

## Python venv (recommended)

```bash
sudo apt install -y python3-venv

python3 -m venv .venv
source .venv/bin/activate

python -m pip install --upgrade pip
pip install -r requirements.txt

uvicorn app:app --host 0.0.0.0 --port 8080
```

Quick checks:

```bash
which python  # .../.venv/bin/python
python -V
```

---

## Publish via Cloudflared (maps to `paypal.exotrend.live`)

We use a **named tunnel** so `https://paypal.exotrend.live` points at `localhost:8080`.

### 1) One-time setup / login

```bash
# Debian/Ubuntu install
curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb -o cloudflared.deb
sudo dpkg -i cloudflared.deb

cloudflared tunnel login
cloudflared tunnel create fastapi-paypal
```

This prints a **Tunnel ID** and stores creds at `~/.cloudflared/<TUNNEL_ID>.json`.

### 2) `/etc/cloudflared/config.yml`

> Order matters; keep the 404 catch-all last.

```yaml
tunnel: <YOUR-TUNNEL-ID>
credentials-file: /home/ubuntu/.cloudflared/<YOUR-TUNNEL-ID>.json

ingress:
  - hostname: paypal.exotrend.live
    service: http://localhost:8080

  - hostname: codespace.exotrend.live
    service: http://localhost:4180
  - hostname: codespace-dev.exotrend.live
    service: http://localhost:8088

  - service: http_status:404
```

### 3) Route DNS to the tunnel

```bash
cloudflared tunnel route dns <YOUR-TUNNEL-ID> paypal.exotrend.live
```

### 4) Start the service

```bash
sudo cloudflared service install
sudo systemctl restart cloudflared
sudo systemctl status cloudflared
journalctl -u cloudflared -f
```

### 5) Smoke test

```bash
curl -I https://paypal.exotrend.live/
curl -I https://paypal.exotrend.live/clientid
```

> Keep the **server-side OTLP proxy** at `POST /otel/v1/traces` so the browser posts to the same origin. The backend forwards to `http://10.172.27.45:4318/v1/traces`—no CORS or TLS drama.

---

## Environment variables

- **Frontend:** `VITE_OTLP_BASE` (defaults to `/otel`)
- **Backend:** `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` (defaults to `http://10.172.27.45:4318/v1/traces`)
- **Payments:** `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET` (set these in `.env` for FastAPI)

---

## Project structure

```
.
├── app.py                 # FastAPI: static hosting, APIs, OTLP proxy
├── requirements.txt
├── .env
├── frontend/
│   ├── public/            # place markdown like README.md, date.md, paypal.md here
│   ├── src/               # React app (incl. otel-init.js)
│   └── dist/              # production build served by FastAPI
└── .devcontainer/         # optional dev container config
```
