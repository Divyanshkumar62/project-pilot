require("dotenv").config();
const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");
const connectDB = require("./config/db");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const helmet = require("helmet");
const { apiLimiter, authLimiter, uploadLimiter, webhookLimiter } = require("./middleware/rateLimiter");
const { startCleanupScheduler } = require("./services/cleanupService");

const authRoutes = require("./routes/auth.route.js");
const projectRoutes = require("./routes/projects.route.js");
const taskRoutes = require("./routes/tasks.route.js");
const invitationRoutes = require("./routes/invitation.route.js");
const notificationRoutes = require("./routes/notification.route.js");
const activityRoutes = require("./routes/activity.route.js");
const commentRoutes = require("./routes/comment.route");
const userRoutes = require("./routes/user.route");
const uploadRoutes = require("./routes/uploads");
const templateRoutes = require("./routes/template.route");
const timeEntryRoutes = require("./routes/timeEntries.route");
const resourceRoutes = require("./routes/resource.route");
const webhookRoutes = require("./routes/webhook.route");
const auth = require("./middleware/auth");
const { listAllUserWebhooks, testGlobalWebhook } = require("./controllers/webhook.controller");
const errorHandler = require("./middleware/errorHandler");

const app = express();

// HTTP Security Headers
app.use(helmet({ crossOriginResourcePolicy: false }));

const allowedOrigins = [
  "http://localhost:5173", 
  "http://localhost:3000",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:3000",
  "https://project-pilot-wine.vercel.app", // Vercel frontend
  "https://project-pilot-two.vercel.app",
];

const isOriginAllowed = (origin) => {
  if (!origin) return true;
  if (allowedOrigins.includes(origin)) return true;
  // Allow any localhost or 127.0.0.1 origin regardless of port for local development
  if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
    return true;
  }
  // Allow any Vercel domain for project-pilot (production & preview branches)
  if (/^https:\/\/project-pilot[a-z0-9-]*\.vercel\.app$/.test(origin)) {
    return true;
  }
  return false;
};

app.use(
  cors({
    origin: function (origin, callback) {
      if (isOriginAllowed(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

// Apply rate limiting in non-test environments
if (process.env.NODE_ENV !== "test") {
  app.use("/api/auth/login", authLimiter);
  app.use("/api/auth/signup", authLimiter);
  app.use("/api/uploads", uploadLimiter);
  app.use("/api", apiLimiter);
}

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static file serving for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// Static file serving for avatars (ad blocker compatible)
app.use('/avatars', express.static(path.join(__dirname, 'uploads/avatars')));

// Routes Configuration
app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/projects/:projectId/tasks", taskRoutes);
app.use("/api/projects/:projectId/invitations", invitationRoutes);
app.use("/api/projects/:projectId/activity", activityRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api", commentRoutes);
app.use("/api/users", userRoutes);
app.use("/api/uploads", uploadRoutes);
app.use("/api/templates", templateRoutes);
app.use("/api/time-entries", timeEntryRoutes);
app.use("/api/resources", resourceRoutes);
app.use("/api/projects/:projectId/webhooks", webhookRoutes);
app.get("/api/webhooks", auth, listAllUserWebhooks);
app.post("/api/webhooks/:webhookId/test", auth, webhookLimiter, testGlobalWebhook);

// Health check endpoint
app.get('/api/health', (req, res) => {
  const uri = process.env.MONGO_URI;
  let mongoHost = 'NOT_SET';
  if (uri) {
    try {
      const parts = uri.split('@');
      mongoHost = parts.length > 1 ? parts[1].split('/')[0] : 'raw_or_local';
    } catch (e) {
      mongoHost = 'PARSING_ERROR';
    }
  }

  res.json({ 
    status: 'OK', 
    service: 'Project Pilot API',
    database: {
      status: mongoose.connection.readyState === 1 ? 'connected' : (mongoose.connection.readyState === 2 ? 'connecting' : 'disconnected'),
      readyState: mongoose.connection.readyState,
      hasMongoUri: !!uri,
      configuredHost: mongoHost,
    },
    timestamp: new Date().toISOString() 
  });
});

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ message: 'API endpoint not found' });
});

// Error handling middleware (must be last)
app.use(errorHandler);

const PORT = process.env.PORT || 5001;

// Create HTTP server and Socket.IO server
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: function (origin, callback) {
      if (isOriginAllowed(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  },
  maxHttpBufferSize: 1e8,
});

// Store connected users with their socket IDs
const connectedUsers = new Map();

// Socket.IO connection handling
io.on('connection', (socket) => {
  // Handle user authentication
  socket.on('authenticate', (userId) => {
    connectedUsers.set(userId, socket.id);
    socket.userId = userId;
    socket.join(userId);
  });

  // Handle joining project rooms
  socket.on('join_project', (projectId) => {
    socket.join(`project_${projectId}`);
  });

  // Handle leaving project rooms
  socket.on('leave_project', (projectId) => {
    socket.leave(`project_${projectId}`);
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    connectedUsers.delete(socket.userId);
  });
});

// Make io instance available globally for controllers
global.io = io;

// Connect to MongoDB and start listening only when run directly as main entrypoint
if (require.main === module) {
  connectDB();
  if (process.env.NODE_ENV !== "test") {
    startCleanupScheduler();
  }
  server.listen(PORT, () => {
    console.log(`🚀 Project Pilot Server running on port ${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔌 Socket.IO enabled`);
  });
}

module.exports = { app, server, io };
