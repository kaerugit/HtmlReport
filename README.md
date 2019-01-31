# HtmlReport
## 概要 
htmlをReportとして使用するためのサンプル  
jsonデータをhtmlテンプレートの内容にあわせて帳票用に加工。  
ページを超えると自動で改ページして  
ヘッダー・フッターなどを再表示する。  

 ## オンラインサンプル（online sample）  
https://kaerugit.github.io/HtmlReport  

## 使用方法
***    
    <!-- 本プロジェクト -->
    <script src="./../javascript/report.js"></script>

    <!-- https://github.com/cognitom/paper-css -->
    <link rel="stylesheet" href="./../css/paper.min.css">
***

## Reportテンプレート処理概要  
各タブに以下Attributeを追加し、そのタグ内に<header><footer>を追加する

reporttype="page"       ページヘッダー・フッター

reporttype="group1～9"  グループヘッダー・フッター

reporttype="detail"     詳細
(reportpropertyには疑似json形式でプロパティを設定)

サンプルイメージ
***
    <div reporttype="page"　reportproperty="{.....}">
        <!-- pageheader(ページヘッダ)-->
        <header style="height:15mm; position:relative">
            <div style="text-align:center">都道府県リスト(page-header)</div>
        </header>
        <!-- pagefooter(ページフッタ)-->
        <footer style="height:15mm; position:relative">
            <div style="text-align:center">フッタ(page-footer)</div>
        </footer>
    </div>
***

テンプレート内でjsonとの連動項目は [[xxx]] で記述

実行は javascript で以下実行  
2番目の引数をtrueの場合 window.print()　を実行  
Report.Run(reportOption, true );  

## プロパティ
javscriptで書くことも可能 sample(norepeat.html参照) 
### reporttype = detail で使用    
    空欄の件数 (number)
    DetailRepeatCount

    データ重複時非表示Field(array)
    HideDuplicatesField

### reporttype = group で使用
    GroupBindfield(string)
    BindField

    改ページの場合、データを繰り返し表示(boolean)
    IsPageRepert

    改ページ（複数は不可） 複数必要な場合はjsonで対応しておくこと
    IsBreakPage

## イベント
各format時のイベント sample(norepeat.html参照)  
FormatEventFunction  

## ヘッダー、フッターの合計計算について
便利なsum関数などはありません。  
あらかじめ計算した結果をjsonにセットして対応してください  

## 苦手なもの
・自然改行が含む帳票（動きが予測できない）
***
【イメージ】  
ああ  
ああ  
---- (自動で改ページ)  
いい  
いいい  
***  
・fontがクライアントに依存するので注意が必要（フォントを固定したい場合はwebfont利用することをおすすめ）  
・用紙のフォーマット(紙に線などが印字済み)が決まっている場合は、ブラウザの解釈によって違うので市販のレポートの使用をおすすめ  

## 最後に
作ってみてなんだけど、ブラウザによって表示が違うので使えないかも  
普通にActiveReports等の利用したほうがよいですが  
ちょっと簡単にReportを作成したい場合には使えるかも・・  
