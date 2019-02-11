const fs = require('fs');
const puppeteer = require('puppeteer');
//console.log('aaaa1');

(async () => {

    // PDFの出力先
    const OUTPUT_PATH = './pdf/';
    // PDFのファイル名
    const FILE_NAME = 'testpdf';
    // PDFの用紙フォーマット
    const FORMAT = 'A4';
    const URL = 'https://kaerugit.github.io/HtmlReport/sample/nomal.html';
  
    
    // Headless Chromeを起動
    await puppeteer.launch()
      .then(async browser => {
        // ページ
        const page = await browser.newPage();
  
        await page.goto(URL, {timeout: 10000, waitUntil:["load", "domcontentloaded"]});
        
        await page.waitFor(selector => !!document.querySelector(selector), {}, ".complete");
        //await page.waitFor(1000*10);
        //await page.waitForSelector('body', {visibility: 'hidden'});

        // 出力先のディレクトリが無ければ生成
        if (!fs.existsSync(OUTPUT_PATH)) {
          fs.mkdirSync(OUTPUT_PATH);
        }

        // PDF作成処理
        await page.pdf({
          path: `${OUTPUT_PATH}${FILE_NAME}.pdf`,
          format: FORMAT
        });

        // Headless Chromeを閉じる
        browser.close();
        
        /*        
        // HTMLの描画ロジック側からwindow.puppeteerPdfでPDF生成
        await page.exposeFunction('puppeteerPdf',
          async () => {
            await console.log(`${OUTPUT_PATH}${FILE_NAME}.pdf`);
              
            // 出力先のディレクトリが無ければ生成
            if (!fs.existsSync(OUTPUT_PATH)) {
              fs.mkdirSync(OUTPUT_PATH);
            }
  
            // PDF作成処理
            await page.pdf({
              path: `${OUTPUT_PATH}${FILE_NAME}.pdf`,
              format: FORMAT
            });
  
            // Headless Chromeを閉じる
            browser.close();
          });
          */
      }); 

})();



