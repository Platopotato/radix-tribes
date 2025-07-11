import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDb } from './db.js';

// Import routes
import authRoutes from './routes/auth.js';
import usersRoutes from './routes/users.js';
import gameRoutes from './routes/game.js';
import adminRoutes from './routes/admin.js';

// Load environment variables
dotenv.config();

// Initialize the database file if it doesn't exist
initDb();

const app = express();
const PORT = process.env.PORT || 3001;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(cors()); // Enable Cross-Origin Resource Sharing
app.use(express.json({ limit: '10mb' })); // Parse JSON bodies, with a larger limit for map uploads

// --- API Routes ---
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/game', gameRoutes);
app.use('/api/tribes', gameRoutes); // Also points to game routes
app.use('/api/requests', gameRoutes); // Also points to game routes
app.use('/api/diplomacy', gameRoutes); // Also points to game routes
app.use('/api/admin', adminRoutes);

// --- Static Frontend Serving ---
// Serve the static files from the React app build directory
app.use(express.static(path.join(__dirname, '..', 'dist')));

// The "catchall" handler: for any request that doesn't match one above,
// send back React's index.html file. This is crucial for client-side routing.
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'dist', 'index.html'));
});


// Health check endpoint
app.get('/', (req, res) => {
  res.send('Radix Tribes Backend is running!');
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
