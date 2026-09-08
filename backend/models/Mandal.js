const mongoose = require('mongoose');
const mandalSchema = new mongoose.Schema({
  name:{type:String,required:true,trim:true},
  address:{type:String,default:'',trim:true},
  mobile:{type:String,default:'',trim:true},
  username:{type:String,required:true,unique:true,lowercase:true,trim:true},
  passwordHash:{type:String,required:true},
  accessUntil:{type:Date,required:true},
  createdAt:{type:Date,default:Date.now}
});
module.exports=mongoose.model('Mandal',mandalSchema);
