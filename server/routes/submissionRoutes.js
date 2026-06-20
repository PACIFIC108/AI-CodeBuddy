const express = require('express');
const Submission = require('../models/Submission');
const HintUsed = require('../models/hintUsed');
const User = require('../models/User');
const { validateSubmission } = require('../middleware/validate');

const router = express.Router();

router.post('/submit', validateSubmission, async (req, res) => {
  try {
    const { user, title, code, language, verdict } = req.body;
    const hint = await HintUsed.exists({ userID: user, questionId: title, status: true });
    const submission = await Submission.findOneAndUpdate(
      { user, questionId: title },
      { code, verdict, language, type: Boolean(hint) },
      { new: true, upsert: true, setDefaultsOnInsert: true, runValidators: true },
    );
    await User.findOneAndUpdate(
      { name: user },
      { $setOnInsert: { name: user }, $addToSet: { history: submission._id } },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    res.status(201).json({ message: 'Submission saved.', submission });
  } catch (error) {
    console.error('Submission error:', error.message);
    res.status(500).json({ error: 'Could not save submission.' });
  }
});

router.get('/:userId', async (req, res) => {
  try {
    const submissions = await Submission.find({ user: req.params.userId }).sort({ updatedAt: -1 }).limit(100);
    res.json(submissions);
  } catch {
    res.status(500).json({ error: 'Could not fetch submissions.' });
  }
});

router.delete('/:user/:problemId', async (req, res) => {
  try {
    const submissions = await Submission.find({ user: req.params.user, questionId: req.params.problemId }).select('_id');
    const ids = submissions.map(item => item._id);
    await Promise.all([
      Submission.deleteMany({ _id: { $in: ids } }),
      User.updateOne({ name: req.params.user }, { $pull: { history: { $in: ids } } }),
      HintUsed.deleteMany({ userID: req.params.user, questionId: req.params.problemId }),
    ]);
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Could not delete submission.' });
  }
});

module.exports = router;
