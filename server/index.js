const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

const hintRoutes = require('./routes/hintRoutes');
const trackRoutes = require('./routes/trackRoutes');
const userRoutes = require('./routes/userRoutes');
const submissionRoutes = require('./routes/submissionRoutes');
const explainRoutes = require('./routes/explainRoutes');
const dryRunRoute = require('./routes/dryrunRoutes');
const analyzeRoutes = require('./controllers/analyzeRoutes');

dotenv.config();

const app = express();
app.use(cors({
  origin:"http://localhost:5173",
  credentials:true
}));
app.use(express.json());


const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.mongo_URL)
.then(()=>{
   console.log('mongodb is connected');
})
.catch((err)=>{
  console.log('mongoDB connection error',err);
})
app.get('/',async (req,res)=>{
 res.status(200).json({message:'Backend is running..'});
});
app.use('/api/hint',hintRoutes);
app.use('/api/user',userRoutes);
app.use('/api/track',trackRoutes);
app.use('/api/submission',submissionRoutes);
app.use('/api/debug',explainRoutes);
app.use('/api/dryrun', dryRunRoute);
app.use('/api/analyze', analyzeRoutes);


app.listen(PORT,()=>{console.log(`server is running on ${PORT}`)});