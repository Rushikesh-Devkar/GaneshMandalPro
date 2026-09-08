const router=require('express').Router();const bcrypt=require('bcryptjs');const jwt=require('jsonwebtoken');const Mandal=require('../models/Mandal');
const seasonEnd=()=>new Date(`${new Date().getFullYear()}-12-31T23:59:59.999`);

router.post('/register',async(req,res)=>{
  try{
    const {name,address,mobile,username,password}=req.body;
    if(!name||!username||!password)return res.status(400).json({message:'मंडळाचे नाव, username आणि password आवश्यक आहे'});
    if(password.length<6)return res.status(400).json({message:'Password किमान 6 characters असावा'});
    const exists=await Mandal.findOne({username:username.toLowerCase()});
    if(exists)return res.status(409).json({message:'Username आधीच वापरलेला आहे'});
    const passwordHash=await bcrypt.hash(password,10);
    const mandal=await Mandal.create({name,address,mobile,username:username.toLowerCase(),passwordHash,accessUntil:seasonEnd(),isApproved:false});
    // No token on register anymore — account stays pending until payment is confirmed by admin.
    res.status(201).json({
      pending:true,
      message:'Registration यशस्वी! Payment केल्यानंतर तुमचे account admin approve करेल. त्यानंतरच login करता येईल.',
      mandal:{id:mandal._id,name:mandal.name,username:mandal.username}
    });
  }catch(e){res.status(500).json({message:e.message});}
});

router.post('/login',async(req,res)=>{
  try{
    const {username,password}=req.body;
    const mandal=await Mandal.findOne({username:(username||'').toLowerCase()});
    if(!mandal||!(await bcrypt.compare(password||'',mandal.passwordHash)))return res.status(401).json({message:'Username किंवा password चुकीचा आहे'});
    if(!mandal.isApproved) return res.status(403).json({pending:true,message:'तुमचे payment अजून confirm झालेले नाही. Admin approval नंतर login करता येईल.'});
    if(new Date(mandal.accessUntil)<new Date())return res.status(403).json({message:'Access period संपला आहे'});
    const token=jwt.sign({mandalId:mandal._id},process.env.JWT_SECRET,{expiresIn:'30d'});
    res.json({token,mandal:{id:mandal._id,name:mandal.name,address:mandal.address,accessUntil:mandal.accessUntil}});
  }catch(e){res.status(500).json({message:e.message});}
});

module.exports=router;