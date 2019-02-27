//参考　https://qiita.com/umi_kappa/items/11f4470b75e01bff5c1b

const fs = require('fs');
const puppeteer = require('puppeteer');
//const http = require('http');

(async () => {

    // PDFの出力先
    const OUTPUT_PATH = './pdf/';
    // PDFのファイル名
    const FILE_NAME = 'testpdf';

    const FULL_FILE_NAME = `${OUTPUT_PATH}${FILE_NAME}.pdf`;
    // PDFの用紙フォーマット (横にする場合は印刷するhtmlの styleを　@page {size: A4 landscape;}　とする)
    const FORMAT = 'A4';
    //出力したいHTML
    const URL = 'https://kaerugit.github.io/HtmlReport/sample/seikyusyo.html';
  
    
    // Headless Chromeを起動
    await puppeteer.launch()
      .then(async browser => {
        // ページ
        const page = await browser.newPage();
  
        await page.goto(URL, {timeout: 10000, waitUntil:["load", "domcontentloaded"]});
        
        //このクラスが出現するまで待つ(.htmlと連携)
        const selector = '.complete';
        await page.waitFor(selector => !!document.querySelector(selector), {timeout: 30000}, selector);
        //await page.waitFor(1000*10);
        
        // 出力先のディレクトリが無ければ生成
        if (!fs.existsSync(OUTPUT_PATH)) {
          fs.mkdirSync(OUTPUT_PATH);
        }

        // PDF作成処理
        await page.pdf({
          path: FULL_FILE_NAME ,
          format: FORMAT　
        });

        // Headless Chromeを閉じる
        browser.close();        
      }); 
       
})();



