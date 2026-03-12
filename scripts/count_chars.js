const fs = require('fs');
const s = fs.readFileSync('server.js','utf8');
console.log('backticks:', (s.split('`').length-1));
console.log("single quotes:", (s.split("'").length-1));
console.log('double quotes:', (s.split('"').length-1));
console.log('open braces { :', (s.split('{').length-1));
console.log('close braces } :', (s.split('}').length-1));
console.log('lines:', s.split(/\r?\n/).length);
