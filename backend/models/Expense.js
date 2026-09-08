const mongoose=require('mongoose');
const schema=new mongoose.Schema({
  mandalId:{type:mongoose.Schema.Types.ObjectId,ref:'Mandal',required:true,index:true},
  spentBy:{type:String,required:true,trim:true}, purpose:{type:String,required:true,trim:true},
  amount:{type:Number,required:true,min:1}, date:{type:Date,required:true},
  description:{type:String,default:'',trim:true}, createdAt:{type:Date,default:Date.now}
});
schema.index({mandalId:1,createdAt:-1});
module.exports=mongoose.model('Expense',schema);
