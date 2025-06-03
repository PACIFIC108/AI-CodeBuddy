const mongoose = require('mongoose');

const hintUsedSchema = new mongoose.Schema({
   userID:{
   	type:String,
   },
   questionId: {
    type: String, 
    required: true,
   },
    status: {
     type: Boolean,
     default: false,
     required: true,
   },
}
);


module.exports = mongoose.model('hintUsed',hintUsedSchema);