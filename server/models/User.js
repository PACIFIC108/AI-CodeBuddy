const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
	name:{
		type:String,
		required:true,
	},
	history:[
		{
			type:mongoose.Schema.Types.ObjectId,
			ref:'Submission',
		}
	]
   },
    {timestamps:true}
);

module.exports = mongoose.model('User',userSchema);