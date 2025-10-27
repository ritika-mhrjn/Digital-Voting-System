import express from 'express';
import mongoose from 'mongoose';
import http from "http";
import { Server } from "socket.io";
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';

import connectDB from './config/db.js';
import authRoutes from './routes/auth.js';
import candidateRoutes from './routes/candidate.js';
import electionRoutes from './routes/election.js';
import voteRoutes from './routes/vote.js';
import resultsRoutes from './routes/results.js';       // ✅ FIXED
import predictionRoutes from './routes/prediction.js'; // ✅ FIXED

dotenv.config();

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(
  cors({
    origin: 'http://localhost:5173', // frontend URL
    credentials: true,
  })
);
app.use(helmet());
app.use(morgan('dev'));

// Rate limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, try again later.',
});
app.use(limiter);

// Default route
app.get('/', (req, res) => {
  res.status(200).send('Real-Time Digital Voting System Backend Running 🚀');
});

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Backend is healthy' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/candidates', candidateRoutes);
app.use('/api/results', resultsRoutes);         // ✅ FIXED
app.use('/api/prediction', predictionRoutes);   // ✅ FIXED
app.use('/api/election', electionRoutes);
app.use('/api/vote', voteRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Server Error',
  });
});

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// ✅ Socket.IO setup
export const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    credentials: true,
  },
});

io.on("connection", (socket) => {
  console.log("New client connected", socket.id);

  socket.on("joinElection", (electionId) => {
    socket.join(electionId); // join a room for that election
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected", socket.id);
  });
});
