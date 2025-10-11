const mongoose = require ('mongoose');

const testUserSchema = new mongoose.Schema({
    username: {
    type: String,
    required: true,   
},
    email: {
    type: String,
    required: true,        
},
    password: {
    type: String,
    required: true,
}
})


const testTokenSchema = new mongoose.Schema({
    token : {
    required: true,
    type: String,    
},
    user: {
    type: mongoose.Schema.Types.ObjectId,
    ref : 'User',
    required: true
},
    createdAt:{
    type: Date,
    default: Date.now
},
    expiresAt : {
    type: Date,
    required: true,
}
})


const testTaskSchema = new mongoose.Schema({
    title : {
    type: String,
    required: true,    
},
    description:{
    type: String,    
},
    status:{
    type: String,
    required: true
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

const TestTask = mongoose.model('TestTask', testTaskSchema, 'tasks')
const TestUser = mongoose.model('TestUser', testUserSchema, 'users')
const TestRefreshToken = mongoose.model('TestRefreshToken', testTokenSchema, 'refreshtokens')




module.exports = {TestUser, TestRefreshToken, TestTask}
