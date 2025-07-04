import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import userRoutes from './routes/userRoutes';
import database from './db/database';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Main Route for API (backend)
app.get('/api', (req: Request, res: Response) => {
  res.status(200).send("Hello from backend!");
});

// API Routes
app.use('/api/users', userRoutes);
//app.use('/api/messages', messageRoutes); // Uncomment when messageRoutes is defined
//app.use('/api/rooms', roomRoutes); // Uncomment when roomRoutes is defined

// Initialize database and start server
const startServer = async () => {
  try {
    // Initialize database (run migrations automatically)
    await database.initializeDatabase();
    
    // Start server after database is ready
    app.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
      console.log(`📊 Database: Initialized and ready`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();