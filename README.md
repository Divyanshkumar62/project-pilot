<p align="center">
  <a href="https://project-pilot-two.vercel.app/">
    <img src="client/public/main-logo.svg" width="96" height="96" alt="Project Pilot Logo" />
  </a>
</p>

<h1 align="center">Project Pilot</h1>

<p align="center">
  <strong>Modern Agile Sprint Management and Team Collaboration Platform</strong>
</p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="License: MIT" /></a>
  <a href="client/"><img src="https://img.shields.io/badge/Frontend-React%2018%20%2B%20Vite-61DAFB.svg" alt="Frontend: React 18" /></a>
  <a href="server/"><img src="https://img.shields.io/badge/Backend-Node.js%20%2B%20Express-339933.svg" alt="Backend: Node.js" /></a>
  <a href="#"><img src="https://img.shields.io/badge/Real--Time-Socket.io%20v4-010101.svg" alt="Real-Time: Socket.io" /></a>
  <a href="#"><img src="https://img.shields.io/badge/Database-MongoDB%20%2B%20Mongoose-47A248.svg" alt="Database: MongoDB" /></a>
  <a href="server/tests/"><img src="https://img.shields.io/badge/Testing-Jest%20%2B%20Supertest-C21325.svg" alt="Testing: Jest" /></a>
  <a href="#"><img src="https://img.shields.io/badge/Animation-Framer%20Motion-FF0055.svg" alt="Animation: Framer Motion" /></a>
</p>

<p align="center">
  <a href="https://project-pilot-two.vercel.app/">Live Demo</a> &bull;
  <a href="#launch-showcase">Launch Video</a> &bull;
  <a href="#features">Features</a> &bull;
  <a href="#tech-stack">Tech Stack</a> &bull;
  <a href="#quickstart">Quickstart</a>
</p>

---

## Overview

Project Pilot is a full-stack agile project management and sprint delivery platform. It enables software teams to organize backlogs, track card movements across real-time Kanban boards, coordinate milestone deliverables, and automate outbound team notifications without communication friction.

* **Live Demo:** [https://project-pilot-two.vercel.app/](https://project-pilot-two.vercel.app/)
* **Repository:** [https://github.com/Divyanshkumar62/project-pilot](https://github.com/Divyanshkumar62/project-pilot)

---

## Launch Showcase

<p align="center">
  <a href="assets/showcase.mp4">
    <img src="assets/poster.jpg" alt="Project Pilot Launch Video" width="100%" style="border-radius: 12px; box-shadow: 0 20px 40px rgba(0,0,0,0.3);" />
  </a>
</p>

<p align="center">
  <em>Click the poster preview above or <a href="assets/showcase.mp4">play the high-definition product walkthrough (assets/showcase.mp4)</a> to view the full product experience.</em>
</p>

---

## Features

* **Real-Time Kanban Boards:** Interactive drag-and-drop task workflow powered by `@dnd-kit` with instant multi-user board synchronization via Socket.io.
* **Threaded Task Collaboration:** Built-in task discussions with author avatars, live comment counters on cards, and permission-gated deletion.
* **Granular Role-Based Permissions:** Two-tier access control separating Workspace Owners, Managers, and Members with secure invitation links.
* **Sprint Milestone Tracking:** Plan sprint deliverables, assign target deadlines, and monitor real-time completion velocity across active projects.
* **Outbound Webhook Integrations:** Automated event dispatches for task and milestone updates secured with HMAC-SHA256 signatures for Slack, Discord, and custom endpoints.
* **Executive Backlog Exports:** One-click structured CSV downloads and print-optimized PDF summary reports for sprint planning and stakeholder reviews.
* **Template Backlog Library:** Ready-to-use workspace templates for common engineering backlogs including Bug Triage, Mobile Release, and API Redesign.
* **Centralized Account Settings:** User management suite with custom profile avatars (< 2MB), bio headlines, active timezone configuration, and credential updates.
* **Automated Data Maintenance:** Hourly background service with seed data protection ensuring preview stability without manual database resets.

---

## Tech Stack

* **Frontend:** React 18, Vite, Tailwind CSS, TanStack React Query, Framer Motion, Recharts, Lucide Icons
* **Backend:** Node.js, Express 4, Socket.io, Mongoose, Helmet, Express Rate Limit, BCrypt, JWT
* **Database:** MongoDB
* **Testing:** Jest, Supertest, MongoDB Memory Server
* **DevOps:** Docker, Docker Compose, GitHub Actions CI/CD

---

## Quickstart

### Prerequisites
* Node.js 18+ and npm
* MongoDB instance (local or MongoDB Atlas)

### 1. Backend Server Setup
```bash
cd server
npm install

# Create environment configuration
cp .env.example .env

# Start development server
npm run dev
```

### 2. Frontend Client Setup
```bash
cd ../client
npm install
npm run dev
```
The client starts on `http://localhost:5173` with hot-module reloading enabled via Vite.

---

## Automated Testing

Project Pilot includes an automated test suite testing authentication, authorization, CRUD lifecycle, and validation against an isolated, in-memory MongoDB server.

```bash
cd server

# Run all test suites
npm test

# Run tests with code coverage report
npm run test:coverage
```

---

## Docker Orchestration

Run the entire platform (Client, Server, and MongoDB) with a single command:

```bash
docker compose up --build
```

Access the application at `http://localhost:5173` with the backend API listening at `http://localhost:5001`.

---

## License

Distributed under the [MIT License](LICENSE).
