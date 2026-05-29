import express from 'express';
import matchRouter from "./routes/matches.js";

const app = express();
const PORT = 8000;

// JSON middleware
app.use(express.json());

// GET route that returns a short message
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to LinkSwift!' });
});
app.use('/matches',matchRouter);

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
