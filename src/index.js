import express from 'express';
import helmet from "helmet";
import http from 'http';
import cors from "cors";

import matchRouter from "./routes/matches.js";
import { attachWebSocketServer} from './validation/ws/server.js';
import { rateLimitMiddleware } from "./middleware/ratelimit.js";
import { commentaryRouter } from './routes/commentary.js';

const PORT =Number(process.env.PORT || 8000);
const HOST =process.env.HOST || '0.0.0.0';

const app = express();
const server=http.createServer(app);
app.use(
  cors({
    origin:["http://localhost:3000",
    "https://link-swift-drab.vercel.app"
    ],
    credentials: true,
  })
);
app.set('trust proxy', true);

// JSON middleware
app.use(express.json());

// Security Layer :using helmet,rate_limiter 
app.use(helmet());
app.use(rateLimitMiddleware);

// GET route that returns a short message
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to LinkSwift!' });
});

app.use('/matches',matchRouter);
app.use('/matches/:id/commentary',commentaryRouter);

// This is where webSockets is attached to the server
// The server object is passed into attachWebSocketServer(). 
// That function creates the WebSocket server and returns two functions that the REST routes can use to broadcast events.
const {
  broadcastMatchCreated ,
  broadcastCommentary 
} = attachWebSocketServer(server);

// app.locals stores these functions so your route handlers can access them later through res.app.locals.
app.locals.broadcastMatchCreated = broadcastMatchCreated;
app.locals.broadcastCommentary = broadcastCommentary;
// Start the server
server.listen(PORT,HOST, () => {
  const baseUrl=HOST==='0.0.0.0' ? `http://localhost:${PORT}`:`http://${HOST}:${PORT}`;
  console.log(`Server is running at http://localhost:${PORT}`);
  console.log(`Websocket server is running on ${baseUrl.replace('http','ws')}/ws`);
});
