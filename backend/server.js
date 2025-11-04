// backend/server.js
// Third-party Libraries
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const events = require('events');


// Local Imports (Configuration and Database)
const connectDB = require('./config/db.js');

// Events Emitter Configuration
events.defaultMaxListeners = 20; // or 0 for unlimited, but 20 is safer

// Routes
const electionRoutes = require('./routes/election.js');
const resultsRoutes = require('./routes/results.js');
const predictionRoutes = require('./routes/prediction.js');
const authRoutes = require('./routes/auth.js');
const candidateRoutes = require('./routes/candidate.js');
const VoterRoutes = require('./routes/voter.js');
const VoteRoutes = require('./routes/vote.js');


dotenv.config();

// Initialize app and connect DB
const app = express();
connectDB();
app.use(
    express.json({ limit: '10mb' }) // <--- KEEP THIS LINE (It correctly parses JSON and sets the body limit)
);
app.use(
  cors({
    origin: 'http://localhost:5173', // your frontend
    credentials: true,
  })
);
app.use(helmet());
app.use(morgan('dev'));

// Rate limiter
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    message: 'Too many requests from this IP, try again later.',
  })
);

// Basic routes
app.get('/', (req, res) =>
  res.status(200).send('Real-Time Digital Voting System Backend Running')
);

app.get('/api/health', (req, res) =>
  res.status(200).json({ status: 'OK', message: 'Backend is healthy' })
);

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/candidates', candidateRoutes);
app.use('/api/election', electionRoutes);
app.use('/api/results', resultsRoutes);
app.use('/api/prediction', predictionRoutes);
app.use('/api/voters', VoterRoutes);
app.use('/api/votes', VoteRoutes);

// 404 handler
app.use((req, res) => res.status(404).json({ message: 'Route not found' }));

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Server Error',
  });
});

// Create server and attach socket.io
const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: 'http://localhost:5173',
    credentials: true,
  },
});
module.exports = { io };
// Socket.IO logic
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  socket.on('joinElection', (electionId) => {
    socket.join(electionId);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Start server
server.listen(PORT, () =>
  console.log(`Server running on http://localhost:${PORT}`)
);
