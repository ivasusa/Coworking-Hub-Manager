import express from 'express';
import cors from 'cors';
import path from 'path';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import authRouter from './routers/authRouter';
import userRouter from './routers/userRouter';
import spaceRouter from './routers/spaceRouter';
import reservationRouter from './routers/reservationRouter';
import reviewRouter from './routers/reviewRouter';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/piaProjekat';

// __dirname = .../backend/src, so '../uploads' = .../backend/uploads
const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(UPLOADS_DIR));

app.use('/api/auth', authRouter);
app.use('/api/users', userRouter);
app.use('/api/spaces', spaceRouter);
app.use('/api/reservations', reservationRouter);
app.use('/api/reviews', reviewRouter);

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    console.log('Serving uploads from:', UPLOADS_DIR);
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });
