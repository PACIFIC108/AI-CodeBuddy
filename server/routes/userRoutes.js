const express = require('express');
const router = express.Router();
const User = require('../models/User'); 


router.post('/:id', async (req, res) => {
  try {
    const name = String(req.params.id || '').trim();
    if (!name || name.length > 80) return res.status(400).json({ error: 'Invalid username.' });
    const user = await User.findOneAndUpdate(
      { name },
      { name },
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
