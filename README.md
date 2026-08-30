# TaskPilot

A Kanban task board with account-based auth and an AI assistant that turns plain-English messages into tasks. Built to practice full-stack integration end to end — React/TypeScript frontend, FastAPI backend, MySQL — containerized and deployed to AWS.

**Backend repo:** [taskpilot-api](https://github.com/evtyy/taskpilot-api) · **Demo:** 

![TaskPilot board](docs/screenshot.png)

## Features

- Kanban board — create, edit, delete, and advance tasks across todo → in progress → done with one click, with search and priority filters
- Login/register with JWT auth; the board and its API are gated behind a real account
- AI chat assistant — describe a task in plain English and an LLM (Groq, GPT-OSS-20B) decides whether to create it via function calling; the model only proposes the call, the backend is what actually writes to the database
- Optimistic UI updates, with automatic rollback if a request fails
- Multi-stage Docker build served by Nginx, deployed to AWS (EC2 + ECR) via GitHub Actions

## Tech Stack

React 19 · TypeScript · Vite · Axios · Nginx · Docker

## Architecture
 
- **Deployment:** this app runs as two containers (this frontend + the [backend](https://github.com/evtyy/taskpilot-api)) on a single AWS EC2 instance, pulling pre-built images from Amazon ECR. `VITE_API_URL` is baked into the image at **build time** — the browser calls the backend directly, so this has to be the backend's real deployed address, not an internal Docker hostname.
- **Database:** the backend connects to MySQL via **Amazon RDS**, with inbound access restricted at the network level to only the EC2 instance's security group — not exposed to the public internet.
- **Credentials:** the EC2 instance pulls from ECR using an **IAM role** attached directly to it, rather than long-lived access keys stored on the box.
- **CI/CD:** this repo and the backend repo each have their own GitHub Actions workflow. Pushing to `main` builds a Docker image, pushes it to ECR, and redeploys it on the EC2 instance over SSH — independently per service.

## Quick Start

Needs the [backend](https://github.com/evtyy/taskpilot-api) running too — see that repo for setup.

```bash
git clone https://github.com/evtyy/taskpilot-frontend.git
cd taskpilot-frontend
npm install
cp .env.example .env      # set VITE_API_URL to wherever the backend is running
npm run dev
```

Runs at `http://localhost:5173`. Note: `VITE_API_URL` is baked in at build/start time — after changing `.env`, restart `npm run dev` rather than just saving the file.

## Running with Docker
 
```bash
docker build --build-arg VITE_API_URL=http://localhost:8000 -t taskpilot-frontend .
docker run -p 3000:80 taskpilot-frontend
```
Same build-time caveat applies — `VITE_API_URL` must point to wherever the backend will actually be reachable from the browser when the container runs, since it can't be changed afterward without rebuilding.

## Project Structure

```
src/
├── api/client.ts       # axios instance, auth token handling, all backend calls
├── types/               # Task and auth type definitions
├── hooks/                 # useTasks, useAuth, useBackendStatus
└── components/               # board UI, login page, chat panel
```
