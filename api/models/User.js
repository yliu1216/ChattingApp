const mongoose = require('mongoose');
const UserSchema = new mongoose.Schema({
    username:{type: 'string', required: true},
    email:{type: 'string', required: true},
    password:{type: 'string',  required:true},
})
const UserModel = mongoose.model('User', UserSchema);
module.exports = UserModel;
