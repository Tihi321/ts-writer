import express, { Express, Request, Response } from "express";
import http from "http";
import { WebSocketServer, WebSocket } from "ws";
import path from "path";

const app: Express = express();
const port = process.env.PORT || 3001;

// Middleware to parse JSON bodies
app.use(express.json());

// Serve static files from the frontend build (optional, can be handled by a separate server)
// app.use(express.static(path.join(__dirname, '../../frontend/dist')));

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

wss.on("connection", (ws: WebSocket) => {
  console.log("Client connected");

  ws.on("message", (message: string) => {
    console.log("received: %s", message);
    // Broadcast message to all clients
    wss.clients.forEach((client: WebSocket) => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(message.toString());
      }
    });
  });

  ws.on("close", () => {
    console.log("Client disconnected");
  });

  ws.on("error", (error: Error) => {
    console.error("WebSocket error:", error);
  });

  ws.send("Welcome to the TSWritter WebSocket server!");
});

app.get("/api", (req: Request, res: Response) => {
  res.send("TSWritter Backend API is running!");
});

// Import and use book and chapter routes
import bookRoutes from "./routes/bookRoutes";
import chapterRoutes from "./routes/chapterRoutes";

app.use("/api/books", bookRoutes);
app.use("/api/books/:bookName/chapters", chapterRoutes);

// The ideaRoutes are now handled within chapterRoutes
// // import ideaRoutes from './routes/ideas';
// // app.use('/api/ideas', ideaRoutes); // This line is no longer needed directly here

server.listen(port, () => {
  console.log(`Backend server is running on http://localhost:${port}`);
  console.log(`WebSocket server is running on ws://localhost:${port}`);
});
