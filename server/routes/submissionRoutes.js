const express = require('express');
const router = express.Router();

const Submission = require('../models/Submission');
const hintUsed = require('../models/hintUsed');

router.post('/submit', async (req, res) => {
  try {
    const { user, title, code, language, verdict } = req.body;
    let hint = false;
    const User = await hintUsed.findOne({user:user,questionId:title});
    if(User)hint = User.status;

    const updatedSubmission = await Submission.findOneAndUpdate(
      { user: user, questionId: title },
      {
        // user,
        code,
        verdict,
        language,
        // questionId: title,
        type:hint
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true
      }
    );

    res.status(201).json({ message: 'Submission saved or updated successfully.', submission: updatedSubmission });
  } catch (err) {
    console.error('Submission Error:', err);
    res.status(500).json({ message: 'Server error saving submission.' });
  }
});


router.get('/:userId',async (req,res)=>{
   try{
     const { userId } = req.params;

     const submission = await Submission.find({user:userId}).sort({createdAt:-1});
     return res.status(200).json(submission);
   }
   catch(err){
     res.status(500).json({message:'Error fetching submission'});
   }
});


router.delete('/:user/:problemId', async (req, res) => {
  try{
    const { user, problemId } = req.params;

    await Submission.deleteMany({ user: user, questionId:problemId });
    res.json({ success: true });
    }catch(err){
        res.status(500).json({error:'Error deleting submission'})
    }
});


module.exports = router;