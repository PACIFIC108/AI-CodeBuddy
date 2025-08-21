const express = require('express');
const router = express.Router();
const User = require('../models/User'); 


router.post('/:id', async (req, res) => {
  try {
    const user = await User.findOneAndUpdate(
      { name: req.params.id },
      { name: req.params.id },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true
      }); 
   
    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});


module.exports = router;
