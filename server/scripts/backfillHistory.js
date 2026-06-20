require('dotenv').config();
const mongoose = require('mongoose');
const Submission = require('../models/Submission');
const User = require('../models/User');

const run = async () => {
  if (!process.env.mongo_URL) throw new Error('mongo_URL is required.');
  await mongoose.connect(process.env.mongo_URL);
  const submissions = await Submission.find({}).select('_id user').lean();
  const grouped = new Map();
  for (const submission of submissions) {
    if (!grouped.has(submission.user)) grouped.set(submission.user, []);
    grouped.get(submission.user).push(submission._id);
  }
  for (const [name, history] of grouped) {
    await User.findOneAndUpdate(
      { name }, { $setOnInsert: { name }, $addToSet: { history: { $each: history } } },
      { upsert: true, setDefaultsOnInsert: true },
    );
  }
  console.log(`Backfilled ${submissions.length} submissions for ${grouped.size} users.`);
  await mongoose.disconnect();
};

run().catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});
