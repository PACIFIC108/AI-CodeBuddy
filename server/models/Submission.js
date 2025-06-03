const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
  user:{
  	type:String,
    required:true,
  },
  code:{
  	type:String,
  	required:true,
  },
  verdict:{
  	type:String,
    // enum: ['Accepted', 'Wrong Answer', 'Runtime Error', 'Time Limit Exceeded', 'Compilation Error'],
  	required:true,
  },
  language:{
  	type:String,
  	required:true,
  },
  questionId:{
  	type:String,
  	required:true,
  },
  type:{
    type:Boolean,
    required:true,
  },
},{timestamps:true});


module.exports = mongoose.model('Submission',submissionSchema);