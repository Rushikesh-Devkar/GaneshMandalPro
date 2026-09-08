const mongoose=require('mongoose');
const schema=new mongoose.Schema({
  mandalId:{type:mongoose.Schema.Types.ObjectId,ref:'Mandal',required:true,index:true},
  receiptNo:{type:String,required:true}, donorName:{type:String,required:true,trim:true},
  mobile:{type:String,default:'',trim:true}, address:{type:String,default:'',trim:true},
  amount:{type:Number,required:true,min:1},
  paymentMode:{type:String,enum:['Cash','Online','Pending'],required:true},
  collectedBy:{type:String,required:true,trim:true}, date:{type:Date,required:true},
  status:{type:String,enum:['Received','Pending'],required:true},
  createdAt:{type:Date,default:Date.now}
});
schema.index({mandalId:1,createdAt:-1});
module.exports=mongoose.model('Contribution',schema);
