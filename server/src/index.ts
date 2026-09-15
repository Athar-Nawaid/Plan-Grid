import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import http from "http";
import { Server } from "socket.io";

dotenv.config();

import { prisma } from "./config/prisma";
import { connectMongo } from "./config/mongo";
import authRoutes from "./routes/authRoutes";
import projectRoutes from "./routes/projectRoutes";
import activityRoutes from "./routes/activityRoutes";
import userRoutes from "./routes/userRoutes";
import { verifyToken, JwtPayload } from "./utils/jwt";
import { initRealtime } from "./services/realtimeService";

const app = express();
const server = http.createServer(app);

const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";
export const io = new Server(server, {
  cors: {
    origin: CLIENT_URL,
    credentials: true,
  },
});
initRealtime(io);

io.use((socket, next) => {
  const token = (socket.handshake.auth?.token as string) || "";
  try {
    const payload = verifyToken(token) as JwtPayload;
    socket.data.userId = payload.sub;
    socket.data.userName = payload.name;
    next();
  } catch {
    next(new Error("Unauthorized"));
  }
});

io.on("connection", (socket) => {
  socket.on("joinProject", (projectId: string) => {
    socket.join(`project:${projectId}`);
  });

  socket.on("leaveProject", (projectId: string) => {
    socket.leave(`project:${projectId}`);
  });

  socket.on("disconnect", () => {
    // rooms auto-cleaned on disconnect
  });
});

app.use(cors({ origin: CLIENT_URL, credentials: true }));
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "plan-grid-api" });
});

app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/activity", activityRoutes);
app.use("/api/users", userRoutes);

app.use((_req, res) => {
  res.status(404).json({ error: "Route not found" });
});

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("[error]", err);
  res.status(500).json({ error: "Internal server error" });
});

const PORT = parseInt(process.env.PORT || "3001", 10);

(async () => {
  await prisma.$connect();
  console.log("[prisma] connected to PostgreSQL");
  await connectMongo();
  server.listen(PORT, () => {
    console.log(`[api] listening on http://localhost:${PORT}`);
  });
})();