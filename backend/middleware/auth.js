const jwt=require('jsonwebtoken');
const Mandal=require('../models/Mandal');
module.exports=async function(req,res,next){
  try{
    const token=(req.headers.authorization||'').replace('Bearer ','');
    if(!token) return res.status(401).json({message:'Login required'});
    const decoded=jwt.verify(token,process.env.JWT_SECRET);
    const mandal=await Mandal.findById(decoded.mandalId).lean();
    if(!mandal) return res.status(401).json({message:'Account not found'});
    if(!mandal.isApproved) return res.status(403).json({message:'Payment pending आहे. Admin approval नंतर access मिळेल.'});
    if(new Date(mandal.accessUntil)<new Date()) return res.status(403).json({message:'तुमचा access period संपला आहे'});
    req.mandal=mandal; next();
  }catch(e){return res.status(401).json({message:'Invalid login session'});}
};