# project-pilot

> Full-stack agile project management and task dependency tracking platform built with React, Node.js, and MongoDB.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Frontend: React](https://img.shields.io/badge/Frontend-React-61DAFB.svg)](client/)
[![Backend: Node.js](https://img.shields.io/badge/Backend-Node.js%20%2B%20Express-339933.svg)](server/)
[![Database: MongoDB](https://img.shields.io/badge/Database-MongoDB-47A248.svg)]()

---

## Overview

`project-pilot` is a collaborative project planning system designed for development teams to manage agile workflows, track task dependencies, and visualize sprint velocity. Built with a decoupled client-server architecture, it emphasizes clean domain models and RESTful API design.

### Key Capabilities
* **Task & Dependency Tracking:** Create, assign, and organize tasks across customizable sprint stages with dependency graphs.
* **Sprint Velocity Analytics:** Real-time progress rollups and task completion metrics.
* **Decoupled Client-Server:** Express REST API server paired with a responsive React frontend interface.
* **Role-Based Collaboration:** Team membership boundaries and scoped permission models.

---

## Codebase Architecture

```
project-pilot/
├── client/     # React single-page application interface
├── server/     # Express REST API, MongoDB Mongoose models, and route controllers
└── LICENSE     # Standard MIT open-source license
```

---

## Quickstart

### Prerequisites
* Node.js 18+
* MongoDB local or cloud instance (Atlas)

### 1. Backend Server Setup
```bash
git clone https://github.com/Divyanshkumar62/project-pilot.git
cd project-pilot/server
npm install
npm run dev
```

### 2. Frontend Client Setup
```bash
cd ../client
npm install
npm start
```

---

## License
Distributed under the [MIT License](LICENSE).
