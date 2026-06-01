const fs = require('fs');
const pdfParse = require('pdf-parse');

async function test() {
  console.log(typeof pdfParse);
  const dataBuffer = fs.readFileSync('uploads/AITest_Redacted (1).pdf');
  const data = await pdfParse(dataBuffer);
  console.log("Extracted text length:", data.text.length);
}
test();
