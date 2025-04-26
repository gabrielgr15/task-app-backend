const mongoose = require('mongoose')

const TaskSchema = new mongoose.Schema({
	title : {
	type: String,
	required: true,
	trim: true
},
	description:{
	type: String,
	trim: true
	
},
	status:{
	type: String,
	trim: true
},
	user:{
	type: mongoose.Schema.Types.ObjectId,
	ref: 'User',
	required: true
},
	createdAt:{
	type: Date,
	default: Date.now
},
	updatedAt:{
	type: Date,
	default: Date.now
}
})

module.exports = mongoose.model('Task', TaskSchema)

