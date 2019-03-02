# HtmlReport
## 概要 
htmlをReportとして使用するためのサンプル(htmlをそのまま印刷)  
jsonデータをhtmlテンプレートの内容にあわせて帳票用に加工  
ページを超えると自動で改ページし  
ヘッダー・フッターなどを再表示機能を簡易的に実行出来ます  

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
(reportpropertyには疑似json形式でプロパティを設定※javasciptでの指定も可)

サンプルイメージ（通常）
***
    <!-- ページ -->
    <div reporttype="page" reportproperty="{.....}">
        <!-- pageheader(ページヘッダ)-->
        <header style="height:15mm; position:relative">
            <div style="text-align:center">都道府県リスト(page-header)</div>
        </header>
        <!-- pagefooter(ページフッタ)-->
        <footer style="height:15mm; position:relative">
            <div style="text-align:center">フッタ(page-footer)</div>
        </footer>
    </div>
    <!-- グループ -->
    <div reporttype="group1" reportproperty="{.....}">
        <header style="height:15mm; position:relative">
            xxxxx
        </header>
        <footer style="height:15mm; position:relative">
            xxxxx
        </footer>
    </div>

    <!-- 詳細 -->
    <div reporttype="detail"  reportproperty="{.....}">
        <div>
            Name：[[name]]
        </div>
    </div>
***

サンプルイメージ（テーブル連結） reporttype="group1" と reporttype="detail" が1つのテーブルとして作成
***
    <div reporttype="group1" reportproperty="{.....}">
        <table>
            <!-- グループヘッダー（reporttype="detail"のテーブルと連結） -->
            <thead>
                <tr>
                    xxxxx
                </tr>
            </thead>
            <!-- グループフッタ（reporttype="detail"のテーブルと連結） -->
            <tfoot>
                <tr>
                    xxxxx
                </tr>
            </tfoot>
        </table>
    </div>

    <div reporttype="detail"  reportproperty="{.....}">
        <table style="width:100%">
            <!-- タイトルはこちらを利用 -->
            <thead>
                <tr>
                    <th style="width:20mm">Name</th>
                </tr>
            </thead>
            <tbody>
                <tr >
                    <td>[[name]]</td>
                </tr>
            </tbody>
            <!-- ページ計などセット(高さを変更するとおかしくなるので注意！) -->
            <tfoot>
                <tr >
                    <td>[[count]]</td>
                </tr>
            </tfoot>
        </table>
    </div>

***

テンプレート内でjsonとの連動項目は [[xxx]] で記述
引数のjsonで該当フィールドが置換されます。

特別文字列：  
[[page]]・・ pagecount(ページ数)  
[[pages]]・・allpagecount(総ページ数)  

formatしたい場合には || の後に文字列を追加 [[xxx||yyyy/MM/dd ]]  
https://github.com/kaerugit/VuejsTableInput  
formatdelimiter の場所参照(javascriptも同じもの参照)  
対象のformatが存在しない場合は自分で作成(改造)するか、bindするデータをformat済みにして対応

レポートの生成は javascript で以下実行  
2番目の引数をtrueの場合 window.print() を実行  
***
Report.Run(reportOption, true );  
***

reportOptionの詳細  
Data: jsonデータ  
MarginCss: 余白用のCSS(string)  
ReportEndFunction: 作成後に呼び出されるfunction(普通のhtmlが作成されるので、必要であればゴリゴリすることも可)  

Page: ReportDataClass(イベントなどの定義も可)  
Detail: ReportDataClas(イベントなどの定義も可)  
Group1～9: ReportDataClass(イベントなどの定義も可)  


## プロパティ
javscriptで書くことも可能 sample(norepeat.html参照) 

* * *  
### reporttype = detail で使用  
* * *  

#### DetailRepeatCount プロパティ (number)  
空欄(trタグ)の件数  

#### HideDuplicatesField プロパティ(array)  
データ重複時非表示Field  

#### IsMergeTable プロパティ(boolean)  
falseの場合、各sectionにtabletagを配置(各sectionと結合しない)  

* * *  
### reporttype = group で使用
* * *  

#### BindField プロパティ(string)  
連結するfield(GroupBindfield)  

#### IsPageRepert プロパティ(boolean)  
改ページの場合、データを繰り返し表示  

#### IsBreakPage プロパティ(boolean)  
BindField プロパティ変更時に改ページ（複数は不可）  
※複数必要な場合はjsonで対応しておくこと  

#### IsPageReset プロパティ(boolean)  
グループの改ページ時に[[page]],[[pages]]をリセットする

#### IsMergeTable プロパティ(boolean)  
falseの場合、各sectionの
**\<header\>(\<footer\>)**
内にtabletagを配置(各sectionと結合しない)  

## イベント
#### FormatEventFunction  イベント  
各format時のイベント sample(norepeat.html参照)  
**※注意：footerについては高さが変更になるエレメントの操作はしないでください**

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
普通に市販ソフトのActiveReports等の利用したほうがよいですが  
ちょっと簡単にReportを作成したい場合には使えるかも・・  

ブラウザによって解釈が違うので、puppeteer(&Headless Chrome)を利用し  
server上でpdfを作成する事も可。  
※sample server フォルダ内  

こちらのコンポーネント使用させて頂きました。(Thank you！)  
https://github.com/cognitom/paper-css
