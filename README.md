# UniClip

Real-time clipboard sync across devices. No accounts, no installs: open the app, pair devices with a short code, and anything you copy shows up on every connected device instantly.

Built for the GDGxIris Recruitments 2026 standalone task.

## Features

- **Account-free pairing** – one device generates a pairing code, others join with it
- **Real-time sync** over WebSockets
- **Device list** showing who is connected to the session
- **Clipboard history** per session, persisted in Cloud Firestore
- **One-click copy** of any item using the browser Clipboard API
- **Connection status** indicator with automatic reconnect

## Tech Stack

| Layer     | Tech                                                   |
|-----------|--------------------------------------------------------|
| Frontend  | React, Vite, CSS, Clipboard API                        |
| Backend   | Node.js, Express, `ws` (WebSocket), Firebase Admin SDK |
| Database  | Cloud Firestore                                        |
| Hosting   | Frontend on Vercel; backend on a WebSocket-capable host |

## How It Works

1. Device A opens the app and creates a session. The server returns a short **pairing code**.
2. Device B opens the app and enters the code to join the same session.
3. Both devices open a WebSocket connection to the backend, scoped to that session.
4. When a device submits clipboard text, the server saves it to Firestore and broadcasts it to every other device in the session.
5. Each device renders the item in its clipboard list, where it can be copied locally with one click.

```
Device A ──┐                      ┌── Device B
           ├── WebSocket ── Express/ws server ── Firestore
Device C ──┘                      └── Device D
```

## Project Structure

```
UniClip/
├── backend/
│   ├── server.js            # Express + WebSocket server (port 8000)
│   └── ...                  # Firebase Admin setup, routes, session logic
└── frontend/
    └── src/
        ├── components/      # Header, PairingCode, DeviceList, ClipboardInput,
        │                    # ClipboardItem, ClipboardList, ConnectionStatus
        ├── hooks/           # useUniClip.js
        ├── services/        # api.js, websocket.js
        ├── pages/           # Home, Session
        ├── App.jsx
        ├── main.jsx
        └── index.css
```

## Prerequisites

- Node.js 18+ and npm
- A Firebase project with **Cloud Firestore** enabled
- A Firebase **service account key** (Project settings → Service accounts → Generate new private key)

## Setup

### 1. Clone

```bash
git clone https://github.com/Havish-11/UniClip.git
cd UniClip
```

### 2. Backend

```bash
cd backend
npm install
```

Create `backend/.env`:

```env
PORT=8000
GOOGLE_APPLICATION_CREDENTIALS=./serviceAccountKey.json
```

Place your Firebase service account key at `backend/serviceAccountKey.json` (never commit it; make sure it is in `.gitignore`).

Start the server:

```bash
npm start
```

The API and WebSocket server run on `http://localhost:8000`.

### 3. Frontend

```bash
cd frontend
npm install
```

Create `frontend/.env`:

```env
VITE_API_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000
```

Start the dev server:

```bash
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

## Usage

1. Open UniClip on your first device and click **Create session**. Note the pairing code.
2. On a second device (or another browser tab), open UniClip and enter the pairing code.
3. Type or paste text into the input box and send it.
4. The text appears instantly on all connected devices. Click an item to copy it to that device's clipboard.
5. Watch the **Connection status** badge; the client reconnects automatically if the socket drops.

> The browser Clipboard API requires a secure context (HTTPS or `localhost`), and may ask for clipboard permission the first time.

## Deployment

- **Frontend (Vercel):** import the repo, set the root directory to `frontend`, and add `VITE_API_URL` and `VITE_WS_URL` pointing to your deployed backend (use `https://` and `wss://`).
- **Backend:** Vercel serverless functions do not support persistent WebSocket connections, so deploy the backend to a host that does (Render, Railway, Fly.io, a VPS, etc.). Provide the Firebase credentials as environment variables or a secret file, and set `PORT` as the host requires.

## Troubleshooting

| Problem | Fix |
|---|---|
| Frontend can't connect | Check `VITE_API_URL` / `VITE_WS_URL` and that the backend is running on port 8000 |
| Mixed content / WebSocket blocked on deploy | Use `wss://` with an HTTPS frontend |
| Firestore permission errors | Confirm the service account key belongs to the right project and Firestore is enabled |
| Copy button does nothing | Use HTTPS or `localhost` and allow clipboard permission |

