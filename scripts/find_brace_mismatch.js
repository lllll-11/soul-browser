const fs = require('fs');
const lines = fs.readFileSync('server.js','utf8').split(/\r?\n/);
let bal = 0;
for (let i=0;i<lines.length;i++){
  const line = lines[i];
  for (let ch of line){
    if (ch==='{') bal++;
    if (ch==='}') bal--;
  }
  if (bal !== 0 && i>0 && i%1===0) {
    // print when balance changes
  }
}
console.log('Final balance:', bal);
for (let i=0, b=0;i<lines.length;i++){
  const line = lines[i];
  for (let ch of line){
    if (ch==='{') b++;
    if (ch==='}') b--;
  }
  if (i<20 || i>lines.length-30) console.log((i+1).toString().padStart(4)+' | '+line+' | bal='+b);
  if (b>0 && i>0 && i<lines.length-1) {
    // continue
  }
}
// Find the line where balance last changed to >0 and never returned
let b=0; let problemLine=-1;
for (let i=0;i<lines.length;i++){
  const line = lines[i];
  for (let ch of line){
    if (ch==='{') b++;
    if (ch==='}') b--;
  }
  if (b>0) problemLine = i+1;
}
console.log('Last line where balance >0:', problemLine);
console.log('Total lines:', lines.length);
