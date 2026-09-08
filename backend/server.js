require('dotenv').config();const express=require('express');const mongoose=require('mongoose');const cors=require('cors');const path=require('path');
const app=express();app.use(cors());app.use(express.json());
app.use('/api/auth',require('./routes/auth'));app.use('/api',require('./routes/data'));
app.use('/generated',express.static(path.join(__dirname,'generated')));app.use(express.static(path.join(__dirname,'../public')));
app.get('*',(req,res)=>res.sendFile(path.join(__dirname,'../public/index.html')));
const PORT=process.env.PORT||5000;
mongoose.connect(process.env.MONGODB_URI).then(()=>app.listen(PORT,()=>console.log(`Server running on ${PORT}`))).catch(err=>{console.error('MongoDB connection failed',err);process.exit(1);});
