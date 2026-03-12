const fs = require('fs');
const s = fs.readFileSync('server.js','utf8');
const lines = s.split(/\r?\n/);
let stack = [];
for (let i=0;i<lines.length;i++){
  const line = lines[i];
  for (let j=0;j<line.length;j++){
    const ch = line[j];
    if (ch === '{') stack.push({line:i+1,col:j+1});
    if (ch === '}') stack.pop();
  }
}
console.log('Unmatched opening braces:', stack.length);
if(stack.length>0) stack.forEach(x=>console.log('line',x.line,'col',x.col,':',lines[x.line-1]));
else console.log('All matched');
