# ProjectFlow (`project-pilot`)

> Real-time agile project management and collaborative team workflow platform built with React 18, Node.js, Express, Socket.io, and MongoDB.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Frontend: React 18](https://img.shields.io/badge/Frontend-React%2018%20%2B%20Vite-61DAFB.svg)](client/)
[![Backend: Node.js](https://img.shields.io/badge/Backend-Node.js%20%2B%20Express-339933.svg)](server/)
[![Real-Time: Socket.io](https://img.shields.io/badge/Real--Time-Socket.io%20v4-010101.svg)]()
[![Database: MongoDB](https://img.shields.io/badge/Database-MongoDB%20%2B%20Mongoose-47A248.svg)]()
[![Testing: Jest](https://img.shields.io/badge/Testing-Jest%20%2B%20Supertest-C21325.svg)](server/tests/)

---

## Overview

**ProjectFlow** (hosted in repository `project-pilot`) is a full-stack project collaboration and sprint execution platform. It provides development teams with a real-time, interactive environment to track tasks, organize projects into milestone deliverables, manage team invitations, and monitor progress metrics.

* **Live Demo:** [https://project-pilot-two.vercel.app/](https://project-pilot-two.vercel.app/)
* **Repository:** [https://github.com/Divyanshkumar62/project-pilot](https://github.com/Divyanshkumar62/project-pilot)

---

## Key Capabilities

* **Interactive Kanban Board:** Drag-and-drop task workflow (`To Do`, `In Progress`, `Completed`) powered by `@dnd-kit/core` with priority filters, search, and pagination.
* **Real-Time Bidirectional Sync:** Live event broadcasts via Socket.io for instantaneous task updates, room-scoped activity feeds, and bell notifications.
* **Extensive RESTful Architecture:** 62 endpoints spanning 10 MongoDB domain schemas (Users, Projects, Tasks, Comments, Invitations, Notifications, Milestones, Resources, Time Entries, Templates).
* **Role-Based Access Control (RBAC):** Scoped permissions separating project Owners, Managers, and Members with invite tokens and email acceptance flows.
* **Delivery Analytics & Time Tracking:** Logged hours per task, milestone completion tracking, and team resource allocation charts rendered with Recharts.
* **Security & Production Hardening:**
  * Express rate limiting (`express-rate-limit`) on authentication and public API endpoints.
  * HTTP security headers via `helmet`.
  * User content sanitization with `sanitize-html`.
  * BCrypt hashed credentials and stateless JWT authentication with role payload validation.
  * In-memory MongoDB automated test suites powered by Jest and Supertest.

---

## System Architecture

```
project-pilot/
├── client/                     # React 18 SPA (Vite, Tailwind CSS, TanStack Query, Recharts)
│   ├── src/pages/              # Dashboard, Projects, Tasks, Invitations, Notifications, Profile
│   ├── src/components/         # Reusable UI primitives, Modals, Kanban drag-and-drop boards
│   └── src/services/           # Modular Axios API service integrations & Socket client
├── server/                     # Node.js + Express 4 REST API & Socket.io server
│   ├── config/                 # Database connection & environment configuration
│   ├── models/ (10)            # Mongoose schemas with indexed lookup patterns
│   ├── controllers/ (12)       # Business logic, authorization gates, and Socket triggers
│   ├── middleware/             # JWT auth, RBAC enforcement, Helmet, Rate limiters, Error handler
│   ├── routes/ (12)            # Versioned API routes mounted on /api/*
│   ├── tests/                  # Hermetic unit & integration test suites (Supertest + In-Memory Mongo)
│   └── scripts/                # Maintenance, task cleanup, and inspection tools
└── docs/                       # Postman collections, architecture notes, and schema reference
```

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

ProjectFlow includes a comprehensive automated test suite testing authentication, authorization, CRUD lifecycle, and validation. Tests run against an isolated, in-memory MongoDB server without requiring live cloud databases.

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
