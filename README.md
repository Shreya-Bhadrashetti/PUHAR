# PUHAR

**Smart chartering advisor with backhaul intelligence for East Coast India ports.**

PUHAR helps bulk cargo charterers decide *what to charter, where to route it, and what to carry on the way back*. It combines four decision models behind one voyage-themed web app: backhaul matching with explainable AI, risk mitigation and rerouting, freight rate forecasting, and vessel optimization.



---

## Table of contents

- [Features](#features)
- [How it works](#how-it-works)
- [Tech stack](#tech-stack)
- [Project structure](#project-structure)
- [Getting started](#getting-started)
- [Environment variables](#environment-variables)
- [API reference](#api-reference)
- [Connecting your models](#connecting-your-models)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)
- [Roadmap](#roadmap)
- [Team and license](#team-and-license)

---

## Features

| # | Module | What it does | Inputs |
|---|--------|--------------|--------|
| 1 | **Backhaul Matcher + Explainable AI** | Finds return-leg cargo for a vessel and explains *why* each match was ranked the way it was | Origin, Destination, Size of cargo, Date of voyage |
| 2 | **Risk Mitigation** | Detects cyclone, port congestion and port-constraint risks and recommends a reroute, always stating the reason | Origin - Destination, Date and time of voyage |
| 3 | **Freight Rate Forecasting** | Predicts the expected freight rate for a route and cargo size | Size of cargo, Origin, Destination |
| 4 | **Vessel Optimization** | Recommends the best-fit vessel size/class for the cargo and route | Size of cargo, Origin, Destination |

**Risk rules**

- **Cyclone (red alert):** rerouting is mandatory and immediate. It is shown as a full-width banner with no accept/decline option.
- **Port constraints and congestion:** a reroute is suggested and the reason (cyclone, port issue, or route traffic) is always stated.

**Landing page**

- Scroll-driven voyage animation: the PUHAR vessel appears, then the four feature cards rise into view.
- **Trends** section with an interactive East Coast freight-rate graph and an interactive weather-alert and cyclone-pattern map.
- Navbar: *Dashboard*, *About PUHAR*, *Trends* scroll to their sections.
- Each feature card opens its own page with a 3D animated transition.

---

## How it works

```
Browser (React)  ──/api/*──▶  FastAPI (main.py)  ──▶  adapters.py  ──▶  services/*  (the 4 models)
        ▲                            │
        └──────── serves built frontend (frontend/dist) in production ────┘
```

In production the backend serves both the API and the built frontend, so the whole app runs from **one link** with no CORS setup.

---

## Tech stack

**Frontend:** React, Vite, Tailwind CSS, React Router, Framer Motion, Recharts, Leaflet / react-leaflet, Axios

**Backend:** Python, FastAPI, Uvicorn, Pydantic, python-dotenv

**Models:** four Python services under `backend/services/`

**Deployment:** Docker, single web service

---

## Project structure

```
Puhar/
├── backend/
│   ├── main.py              # FastAPI app, routes, serves frontend build
│   ├── config.py            # loads .env, CORS, paths
│   ├── adapters.py          # connects API to the four model services
│   ├── services/            # backhaul, risk, forecast, vessel models
│   ├── data/                # freight.json, weather.json (trend graphs)
│   ├── requirements.txt
│   ├── .env                 # secrets (never commit)
│   └── .env.example         # safe template
├── frontend/
│   ├── design/              # UI/UX references (Figma link, screens, spec)
│   ├── src/
│   │   ├── api/             # axios client and endpoint functions
│   │   ├── components/      # layout, scene, map, charts, cards, alerts
│   │   ├── pages/           # BackhaulMatcher, RiskMitigation, Forecast, Vessel
│   │   ├── hooks/           # useApi
│   │   └── styles/          # design tokens
│   ├── .env
│   ├── .env.production
│   └── vite.config.js
├── Dockerfile
├── .gitignore
└── README.md
```

---

