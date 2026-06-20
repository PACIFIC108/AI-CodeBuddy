const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const hintRoutes = require('./routes/hintRoutes');
const trackRoutes = require('./routes/trackRoutes');
const userRoutes = require('./routes/userRoutes');
const submissionRoutes = require('./routes/submissionRoutes');
const explainRoutes = require('./routes/explainRoutes');
const dryRunRoute = require('./routes/dryrunRoutes');
const analyzeRoutes = require('./controllers/analyzeRoutes');
const { rateLimit } = require('./middleware/rateLimit');


const app = express();
const configuredOrigins = (process.env.CORS_ORIGINS || 'http://localhost:5173')
  .split(',').map(origin => origin.trim()).filter(Boolean);
app.use(cors({
  origin(origin, callback) {
    const allowed = !origin || configuredOrigins.includes(origin) || /^chrome-extension:\/\/[a-p]{32}$/.test(origin);
    callback(allowed ? null : new Error('Origin is not allowed by CORS.'), allowed);
  },
  methods: ['GET', 'POST', 'DELETE'],
}));
app.use(express.json({ limit: '150kb' }));
app.use('/api', rateLimit({ windowMs: 60000, limit: 60 }));
app.use('/api/analyze', rateLimit({ windowMs: 60000, limit: 12 }));


const PORT = process.env.PORT || 5000;

if (!process.env.mongo_URL) {
  console.error('mongo_URL is required.');
  process.exit(1);
}

mongoose.connect(process.env.mongo_URL)
  .then(() => {
    console.log('mongodb is connected');
  })
  .catch((err) => {
    console.log('mongoDB connection error', err);
  })


app.use('/api/hint', hintRoutes);
app.use('/api/user', userRoutes);
app.use('/api/track', trackRoutes);
app.use('/api/submission', submissionRoutes);
app.use('/api/debug', explainRoutes);
app.use('/api/dryrun', dryRunRoute);
app.use('/api/analyze', analyzeRoutes);


app.get('/', async (req, res) => {
  res.status(200).json({ message: 'Backend is running..' });
});

app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);
  console.error('Request error:', error.message);
  res.status(error.type === 'entity.too.large' ? 413 : 500).json({ error: 'Request could not be processed.' });
});

app.listen(PORT, () => { console.log(`server is running on ${PORT}`) });
