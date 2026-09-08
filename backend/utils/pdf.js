const PDFDocument=require('pdfkit');
const fs=require('fs'); const path=require('path');
const outDir=path.join(__dirname,'..','generated');
function ensure(){fs.mkdirSync(path.join(outDir,'receipts'),{recursive:true});fs.mkdirSync(path.join(outDir,'reports'),{recursive:true});}
function money(n){return 'Rs. '+Number(n||0).toLocaleString('en-IN');}
function safe(v){return String(v??'').replace(/[\\/:*?"<>|]/g,'-');}
function receipt(contribution,mandal){
  ensure(); const file=path.join(outDir,'receipts',`receipt-${contribution.receiptNo}.pdf`);
  const doc=new PDFDocument({size:'A4',margin:50}); const stream=fs.createWriteStream(file); doc.pipe(stream);
  doc.fontSize(22).font('Helvetica-Bold').text(mandal.name,{align:'center'});
  doc.moveDown(.2).fontSize(11).font('Helvetica').text(mandal.address||'Ganesh Mandal',{align:'center'});
  doc.moveDown().fontSize(18).font('Helvetica-Bold').text('VARGANI RECEIPT / PAVTI',{align:'center'});
  doc.moveDown(); doc.fontSize(12).font('Helvetica');
  const rows=[['Receipt No.',contribution.receiptNo],['Date',new Date(contribution.date).toLocaleDateString('en-IN')],['Donor Name',contribution.donorName],['Mobile',contribution.mobile||'-'],['Address',contribution.address||'-'],['Amount',money(contribution.amount)],['Payment Mode',contribution.paymentMode],['Collected By',contribution.collectedBy],['Status',contribution.status]];
  rows.forEach(r=>{doc.font('Helvetica-Bold').text(r[0]+': ',{continued:true});doc.font('Helvetica').text(r[1]);doc.moveDown(.25);});
  doc.moveDown(2).fontSize(11).text('Thank you for your valuable contribution.',{align:'center'});
  doc.end(); return new Promise((resolve,reject)=>{stream.on('finish',()=>resolve(file));stream.on('error',reject);});
}
function report(contributions,expenses,mandal,stats){
  ensure(); const file=path.join(outDir,'reports',`report-${mandal._id}-${Date.now()}.pdf`); const doc=new PDFDocument({size:'A4',margin:40}); const stream=fs.createWriteStream(file);doc.pipe(stream);
  doc.fontSize(20).font('Helvetica-Bold').text(mandal.name,{align:'center'});doc.fontSize(16).text('Income & Expense Report',{align:'center'});doc.moveDown();
  doc.fontSize(11).font('Helvetica').text(`Generated: ${new Date().toLocaleString('en-IN')}`);doc.moveDown();
  doc.font('Helvetica-Bold').fontSize(13).text('SUMMARY');doc.font('Helvetica').fontSize(11);
  [['Total Vargani',stats.totalVargani],['Total Jama',stats.totalCollection],['Cash Jama',stats.cash],['Online Jama',stats.online],['Pending',stats.pending],['Total Expense',stats.totalExpense],['Current Balance',stats.balance]].forEach(r=>doc.text(`${r[0]}: ${money(r[1])}`));
  doc.moveDown();doc.font('Helvetica-Bold').text('VARGANI ENTRIES');doc.font('Helvetica');
  contributions.forEach((x,i)=>doc.text(`${i+1}. ${x.receiptNo} | ${x.donorName} | ${money(x.amount)} | ${x.paymentMode} | ${x.status} | ${new Date(x.date).toLocaleDateString('en-IN')}`));
  doc.moveDown();doc.font('Helvetica-Bold').text('EXPENSE ENTRIES');doc.font('Helvetica');
  expenses.forEach((x,i)=>doc.text(`${i+1}. ${x.spentBy} | ${x.purpose} | ${money(x.amount)} | ${new Date(x.date).toLocaleDateString('en-IN')}`));
  doc.end();return new Promise((resolve,reject)=>{stream.on('finish',()=>resolve(file));stream.on('error',reject);});
}
module.exports={receipt,report};
