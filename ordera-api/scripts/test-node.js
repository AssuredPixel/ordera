const fs = require('fs');
console.log('Node is alive');
try {
  const content = fs.readFileSync('.env', 'utf8');
  console.log('.env read success, length:', content.length);
} catch (e) {
  console.log('.env read failed:', e.message);
}
console.log('Test finished');
