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
    origin: "http://localhost:3000",
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

const {broadcastMatchCreated,broadcastCommentary }=attachWebSocketServer(server);
app.locals.broadcastMatchCreated = broadcastMatchCreated;
app.locals.broadcastCommentary = broadcastCommentary;
// Start the server
server.listen(PORT,HOST, () => {
  const baseUrl=HOST==='0.0.0.0' ? `http://localhost:${PORT}`:`http://${HOST}:${PORT}`;
  console.log(`Server is running at http://localhost:${PORT}`);
  console.log(`Websocket server is running on ${baseUrl.replace('http','ws')}/ws`);
});
