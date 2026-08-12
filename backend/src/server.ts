import express from 'express';
import cors from 'cors';
import routes from './routes';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api', routes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'VirtualCare Backend API' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
