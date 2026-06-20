const mongoose = require('mongoose');

const hintUsedSchema = new mongoose.Schema({
   userID:{
    type:String,
    required:true,
    trim:true,
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

hintUsedSchema.index(
  { userID: 1, questionId: 1 },
  { unique: true, partialFilterExpression: { userID: { $type: 'string' } } },
);

module.exports = mongoose.model('hintUsed',hintUsedSchema);
