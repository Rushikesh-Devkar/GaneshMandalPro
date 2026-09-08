const router=require('express').Router();
const jwt=require('jsonwebtoken');
const Mandal=require('../models/Mandal');

// Admin credentials come from environment variables — never hardcode them here.
const ADMIN_USERNAME=process.env.ADMIN_USERNAME;
const ADMIN_PASSWORD=process.env.ADMIN_PASSWORD;

function adminAuth(req,res,next){
  try{
    const token=(req.headers.authorization||'').replace('Bearer ','');
    if(!token) return res.status(401).json({message:'Admin login required'});
    const decoded=jwt.verify(token,process.env.JWT_SECRET);
    if(decoded.role!=='admin') return res.status(403).json({message:'Not authorized'});
    next();
  }catch(e){return res.status(401).json({message:'Invalid admin session'});}
}

router.post('/login',(req,res)=>{
  const {username,password}=req.body;
  if(!ADMIN_USERNAME||!ADMIN_PASSWORD){
    return res.status(500).json({message:'Admin credentials configured नाहीत (ADMIN_USERNAME/ADMIN_PASSWORD env var सेट करा)'});
  }
  if(username!==ADMIN_USERNAME||password!==ADMIN_PASSWORD){
    return res.status(401).json({message:'चुकीचा admin username/password'});
  }
  const token=jwt.sign({role:'admin'},process.env.JWT_SECRET,{expiresIn:'12h'});
  res.json({token});
});

// List all mandals — pending first, newest first within each group
router.get('/mandals',adminAuth,async(req,res)=>{
  const mandals=await Mandal.find().sort({isApproved:1,createdAt:-1}).lean();
  res.json(mandals.map(m=>({
    id:m._id,name:m.name,address:m.address,mobile:m.mobile,username:m.username,
    isApproved:m.isApproved,accessUntil:m.accessUntil,createdAt:m.createdAt
  })));
});

// Approve a mandal after payment is confirmed manually
router.put('/mandals/:id/approve',adminAuth,async(req,res)=>{
  const seasonEnd=new Date(`${new Date().getFullYear()}-12-31T23:59:59.999`);
  const mandal=await Mandal.findByIdAndUpdate(req.params.id,{isApproved:true,accessUntil:seasonEnd},{new:true});
  if(!mandal) return res.status(404).json({message:'Mandal not found'});
  res.json({ok:true,mandal});
});

// Revoke / un-approve (e.g. refund, chargeback)
router.put('/mandals/:id/revoke',adminAuth,async(req,res)=>{
  const mandal=await Mandal.findByIdAndUpdate(req.params.id,{isApproved:false},{new:true});
  if(!mandal) return res.status(404).json({message:'Mandal not found'});
  res.json({ok:true,mandal});
});

// Reject / delete a registration that never paid
router.delete('/mandals/:id',adminAuth,async(req,res)=>{
  await Mandal.findByIdAndDelete(req.params.id);
  res.json({ok:true});
});

module.exports=router;