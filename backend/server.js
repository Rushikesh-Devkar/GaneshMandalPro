require('dotenv').config();const express=require('express');const mongoose=require('mongoose');const cors=require('cors');const path=require('path');
const app=express();app.use(cors());app.use(express.json());
app.use('/api/auth',require('./routes/auth'));app.use('/api/admin',require('./routes/admin'));app.use('/api',require('./routes/data'));
app.use('/generated',express.static(path.join(__dirname,'generated')));app.use(express.static(path.join(__dirname,'../public')));
app.get('*',(req,res)=>res.sendFile(path.join(__dirname,'../public/index.html')));

// Catch any error (bad JSON body, thrown errors, etc.) and always reply with valid JSON
// instead of letting the connection drop with an empty body.
app.use((err,req,res,next)=>{
  console.error('Unhandled route error:',err);
  if(res.headersSent) return next(err);
  res.status(err.status||500).json({message:err.message||'Server error'});
});

// Log instead of silently dying so Render logs show the real cause of a crash.
process.on('unhandledRejection',(reason)=>console.error('Unhandled Rejection:',reason));
process.on('uncaughtException',(err)=>console.error('Uncaught Exception:',err));

const PORT=process.env.PORT||5000;
mongoose.connect(process.env.MONGODB_URI).then(()=>app.listen(PORT,()=>console.log(`Server running on ${PORT}`))).catch(err=>{console.error('MongoDB connection failed',err);process.exit(1);});