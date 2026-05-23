const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function testTools() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  const results = [];

  const pdfFile = path.resolve(__dirname, 'dummy.pdf');
  const imgFile = path.resolve(__dirname, 'sample.jpg');
  
  // 1. Merge PDF
  try {
    await page.goto('http://localhost:3000/tools/merge-pdf');
    await page.waitForLoadState('networkidle');
    await page.setInputFiles('input[type="file"]', [pdfFile, pdfFile]);
    await page.click('button:has-text("Merge PDFs")');
    // Wait for the download button to appear indicating success
    await page.waitForSelector('a:has-text("Download PDF")', { timeout: 10000 });
    results.push({ tool: 'Merge PDF', route: '/tools/merge-pdf', status: 'working' });
  } catch (e) {
    results.push({ tool: 'Merge PDF', route: '/tools/merge-pdf', status: 'broken', issue: e.message });
  }

  // 2. Split PDF
  try {
    await page.goto('http://localhost:3000/tools/split-pdf');
    await page.waitForLoadState('networkidle');
    await page.setInputFiles('input[type="file"]', [pdfFile]);
    // It might auto-process or require a button click
    const splitBtn = await page.$('button:has-text("Split PDF")');
    if (splitBtn) await splitBtn.click();
    await page.waitForSelector('a:has-text("Download")', { timeout: 10000 });
    results.push({ tool: 'Split PDF', route: '/tools/split-pdf', status: 'working' });
  } catch (e) {
    results.push({ tool: 'Split PDF', route: '/tools/split-pdf', status: 'broken', issue: e.message });
  }

  // 3. Compress PDF
  try {
    await page.goto('http://localhost:3000/tools/compress-pdf');
    await page.waitForLoadState('networkidle');
    await page.setInputFiles('input[type="file"]', [pdfFile]);
    const compressBtn = await page.$('button:has-text("Compress PDF")');
    if (compressBtn) await compressBtn.click();
    await page.waitForSelector('a:has-text("Download")', { timeout: 20000 });
    results.push({ tool: 'Compress PDF', route: '/tools/compress-pdf', status: 'working' });
  } catch (e) {
    results.push({ tool: 'Compress PDF', route: '/tools/compress-pdf', status: 'broken', issue: e.message });
  }

  // 4. JPG to PDF
  try {
    await page.goto('http://localhost:3000/tools/jpg-to-pdf');
    await page.waitForLoadState('networkidle');
    if (fs.existsSync(imgFile)) {
      await page.setInputFiles('input[type="file"]', [imgFile]);
      const convertBtn = await page.$('button:has-text("Convert to PDF")');
      if (convertBtn) await convertBtn.click();
      await page.waitForSelector('a:has-text("Download")', { timeout: 10000 });
      results.push({ tool: 'JPG to PDF', route: '/tools/jpg-to-pdf', status: 'working' });
    } else {
      results.push({ tool: 'JPG to PDF', route: '/tools/jpg-to-pdf', status: 'broken', issue: 'sample.jpg not found' });
    }
  } catch (e) {
    results.push({ tool: 'JPG to PDF', route: '/tools/jpg-to-pdf', status: 'broken', issue: e.message });
  }

  // 5. PDF to JPG
  try {
    await page.goto('http://localhost:3000/tools/pdf-to-jpg');
    await page.waitForLoadState('networkidle');
    await page.setInputFiles('input[type="file"]', [pdfFile]);
    const extractBtn = await page.$('button:has-text("Convert to JPG")');
    if (extractBtn) await extractBtn.click();
    await page.waitForSelector('a:has-text("Download")', { timeout: 20000 });
    results.push({ tool: 'PDF to JPG', route: '/tools/pdf-to-jpg', status: 'working' });
  } catch (e) {
    results.push({ tool: 'PDF to JPG', route: '/tools/pdf-to-jpg', status: 'broken', issue: e.message });
  }

  await browser.close();
  console.log(JSON.stringify(results, null, 2));
}

testTools().catch(console.error);
