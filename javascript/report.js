var Report = {};

var FormatEventType = {
    Header: 100,
    Footer: 200,
    Detail: 0,
    /*詳細空白行*/
    DetailBlank: 10,
};

Report.ReportDataClass = function () {

    //◆◆pravate(外部から設定しないでください！)◆◆
    this.element = null;

    this.tableElement = null;
    this.headerElement = null;
    this.footerElement = null;
    this.detailElement = null;

    //mergetable first
    this.isFirstMergeTable = null;

    this.newElement = null;
    this.appendElement = null;
    this.findElementName = null;

    //Property

    //◆◆以下共通◆◆

    /**
     * tabletag not Merge : false 
     * テーブルタグをマージしない場合：false 
     * @param hoge {bool} - 
     */
    this.IsMergeTable = null;

    //■■Detailで使用■■
    //空欄の件数 Detailで使用 ※ページを超える場合は無視
    this.DetailRepeatCount = null;

    //データ重複時非表示Field
    this.HideDuplicatesField = null;

    //■■ Groupで使用■■

    //GroupBindfield
    this.BindField = null;

    //改ページの場合、データを繰り返し表示(GroupHeaderのみ)
    this.IsPageRepert = null;

    //改ページ（複数は不可） 複数必要な場合はjsonで対応しておくこと
    this.IsBreakPage = null;

    //format時のイベント
    this.FormatEventFunction = null //function (fet, ele, data) {}


    //IsBreakPage時にpageをreset
    this.IsPageReset = null;
};

Report.ReportClass = function () {
    this.Page = new Report.ReportDataClass();
    this.Group1 = new Report.ReportDataClass();
    this.Group2 = new Report.ReportDataClass();
    this.Group3 = new Report.ReportDataClass();
    this.Group4 = new Report.ReportDataClass();
    this.Group5 = new Report.ReportDataClass();
    this.Group6 = new Report.ReportDataClass();
    this.Group7 = new Report.ReportDataClass();
    this.Group8 = new Report.ReportDataClass();
    this.Group9 = new Report.ReportDataClass();
    this.Detail = new Report.ReportDataClass();
}

/**
 * @param reportOption {ReportDataClass} - 
 * @param isPrint {bool} - true:window.print() run(実行);
 */
Report.Run = function (reportOption,isPrint) {
    outPutData = reportOption["Data"];

    if (outPutData == null || outPutData.length == 0) {
        return;
    }

    const addGroup = function (findElementName) {
        let new_table = null;
        let new_Body = null;
        if (report.Detail.IsMergeTable == true) {
            new_table = report.Detail.tableElement.cloneNode(true);

            new_table.removeChild(new_table.querySelector("tbody"));
            new_table.setAttribute(findElementName, "");

            new_Body = document.createElement("tbody");
            new_table.appendChild(new_Body);
            //PageDataObject.CurrentPageDetail = document.createElement("tbody");
            //new_table.appendChild(PageDataObject.CurrentPageDetail);

            PageDataObject.CurrentTableHeader = new_table.querySelector("thead");
            PageDataObject.CurrentTableFooter = new_table.querySelector("tfoot");
        }

        for (let i = 0; i < reportkeys.length; i++) {
            let reportdata = report[reportkeys[i]]; //new ReportDataClass();

            if (reportdata != null) {
                if (new_table != null && reportdata.IsMergeTable == true) {
                    reportdata.newElement = new_table;
                    reportdata.appendElement = new_Body;
                    reportdata.findElementName = findElementName;
                }
                else {
                    reportdata.newElement = null;
                    reportdata.appendElement = PageDataObject.CurrentPageDetail;
                    reportdata.findElementName = "";
                }
            }
        }
    };

    //ページの追加
    const addPage = function () {
        PageDataObject.SectionElement = section.cloneNode(true);
        body.appendChild(PageDataObject.SectionElement);
        PageDataObject.IsPageAutoBreak = false;
        PageDataObject.PageDataCount = 0;
        PageDataObject.BreakPageHeight = pageHeight;
        PageDataObject.ExistsDetail = false;
        PageDataObject.CurrentTableHeader = null;
        PageDataObject.CurrentTableFooter = null;
        PageDataObject.CurrentPageFooter = null;

        let clientHeight = 0;
        if (report.Page.headerElement != null) {
            let newheader = report.Page.headerElement.cloneNode(true);

            replaceData(newheader, PageDataObject.CurrentData);

            //イベント発行
            if (report.Page.FormatEventFunction != null) {
                report.Page.FormatEventFunction(FormatEventType.Header, newheader, PageDataObject.CurrentData);
            }

            newheader.setAttribute(PARENT_ATTRIBUTE, "");
            PageDataObject.SectionElement.appendChild(newheader);

            clientHeight = newheader.offsetHeight;
        }
        PageDataObject.BreakPageHeight -= clientHeight;

        //詳細用のdiv
        PageDataObject.CurrentPageDetail = document.createElement("div");
        PageDataObject.CurrentPageDetail.setAttribute(PARENT_ATTRIBUTE, "");
        PageDataObject.SectionElement.appendChild(PageDataObject.CurrentPageDetail);

        addGroup(TABLE_ATTRIBUTE);

        //高さ用のダミー(bottomで処理するとうまくいかない為)
        PageDataObject.DummyDiv = document.createElement("div");
        PageDataObject.SectionElement.appendChild(PageDataObject.DummyDiv);

        clientHeight = 0;
        if (report.Page.footerElement != null) {
            PageDataObject.CurrentPageFooter = report.Page.footerElement.cloneNode(true);

            PageDataObject.CurrentPageFooter.setAttribute(PARENT_ATTRIBUTE, "");
            PageDataObject.SectionElement.appendChild(PageDataObject.CurrentPageFooter);
            clientHeight = PageDataObject.CurrentPageFooter.offsetHeight;
        }
        PageDataObject.BreakPageHeight -= clientHeight;

        if (PageDataObject.BreakPageHeight <= 0) {
            //詳細の高さが0
            alert('developError:NoDetailHeight');
            return;
        }
    };

    //フッターの追加（設定）
    const addFooter = function (tableFooterOnlyFlag) {

        tableFooterOnlyFlag = tableFooterOnlyFlag || false;

        //footerの置換処理
        if (PageDataObject.CurrentTableFooter != null) {
            let ele = PageDataObject.CurrentTableFooter;

            //一度セットしたものは無視する
            if (ele.getAttribute("end") == null) {
                ele.setAttribute("end", "");
                //テンプレートより置換
                replaceData(ele, PageDataObject.CurrentData);
                if (report.Detail.FormatEventFunction != null) {
                    report.Detail.FormatEventFunction(FormatEventType.Footer, ele, PageDataObject.CurrentData);
                }
            }
        }

        if (tableFooterOnlyFlag == false) {
            //空白行の設定
            if (report.Detail.DetailRepeatCount != 0 && PageDataObject.PageDataCount < report.Detail.DetailRepeatCount) {

                for (i = PageDataObject.PageDataCount; i < report.Detail.DetailRepeatCount; i++) {
                    let ele = report.Detail.detailElement.cloneNode(true);

                    //テンプレートより置換
                    replaceData(ele, {});
                    if (report.Detail.FormatEventFunction != null) {
                        report.Detail.FormatEventFunction(FormatEventType.DetailBlank, ele, {});
                    }

                    tableFlag = report.Detail.IsMergeTable

                    let eleArray = null;
                    let apdEle = report.Detail.appendElement;

                    if (tableFlag) {
                        eleArray = ele.querySelectorAll("tr");

                        if (eleArray.length > 0) {
                            for (let index = 0; index < eleArray.length; index++) {
                                apdEle.appendChild(eleArray[index]);
                            }
                        }

                    }
                    else {
                        apdEle.appendChild(ele);
                    }

                    //改ページ分を超えた場合(pagebreak)★（似たような記述あり）
                    if (PageDataObject.BreakPageHeight < +(PageDataObject.CurrentPageDetail.offsetHeight)) {

                        if (eleArray != null) {
                            for (let index = 0; index < eleArray.length; index++) {
                                apdEle.removeChild(eleArray[index]);
                            }
                        }
                        else {
                            apdEle.removeChild(ele);
                        }

                        break;
                    }


                }
            }

            if (PageDataObject.CurrentPageFooter != null) {

                //テンプレートより置換
                replaceData(PageDataObject.CurrentPageFooter, PageDataObject.CurrentData);

                if (report.Page.FormatEventFunction != null) {
                    report.Page.FormatEventFunction(FormatEventType.Footer, PageDataObject.CurrentPageFooter, PageDataObject.CurrentData);
                }

                //高さの計算
                let dummyHeight = 0;
                //PARENT_ATTRIBUTE の Attributeがついているものを全取得
                let oya = PageDataObject.SectionElement.querySelectorAll("[" + PARENT_ATTRIBUTE + "]");
                for (let index = 0; index < oya.length; index++) {
                    dummyHeight += +(oya[index].offsetHeight);
                }

                dummyHeight = pageHeight - dummyHeight;
                if (dummyHeight > 0) {
                    //ダミーの高さをセット
                    PageDataObject.DummyDiv.style.height = dummyHeight + "px";
                }
            }

        }
    };

    //各functionをまたぐ変数
    let PageDataObject = {
        SectionElement: null,

        //改ページの高さ
        BreakPageHeight: 0,
        //ページ内のデータ件数
        PageDataCount: 0,
        //現在の仮想位置
        //CurrentDetaiTop: 0,

        //詳細を通過したかどうか
        ExistsDetail: false,

        IsPageAutoBreak: false,

        ALLData: outPutData,

        CurrentData: null,

        LoopCount: 0,

        AddPageFunc: addPage,

        AddFooterFunc: addFooter,

        CurrentTableHeader: null,
        CurrentTableFooter: null,

        CurrentPageFooter: null,

        //ページ切り替え用　どこまで処理を行ったか
        PageExecuteManage: [],
        //次のページに表示するデータ(グループ繰り返し用)
        //NextPageGroupElement: [],
        //次のページに表示するデータ
        //NextPageElement: [],

        //詳細のElement
        CurrentPageDetail: null,

        DummyDiv: null,

        //データ連結が存在するものだけ管理(スピードUP用)
        KeyBindList: [],
    };

    //ページ処理がある場合
    let pageFlag = false;

    let allHTML = document.body.innerHTML;
    if (allHTML.indexOf("[[page]]") > -1 || allHTML.indexOf("[[page]]") > -1) {
        PageDataObject.KeyBindList.push("page");
        PageDataObject.KeyBindList.push("pages");
        pageFlag = true;
    }

    //連結項目の存在チェック
    let keys = Object.keys(outPutData[0]);
    for (let i = 0; i < keys.length; i++) {
        if (allHTML.match(new RegExp("(\\[\\[(" + keys[i] + "|" + keys[i] + "(\\s)*\\|\\|.+?)\\]\\])", "g"))){
            PageDataObject.KeyBindList.push(keys[i]);
        }
    }

    //親の要素
    const PARENT_ATTRIBUTE = "oya";
    const TABLE_ATTRIBUTE = "tableappend";
    const GROUP_PAGE_ATTRIBUTE = "GroupPage";

    let body = document.body;
    //グループの配列
    let groupArray = [];

    //body.style.visibility = "hidden";

    //初期値取得
    let report = new Report.ReportClass();
    //let reportproperty = new reportPropertyClass();

    let reportkeys = Object.keys(report);

    //初期化
    const init = function () {
        for (let i = 0; i < reportkeys.length ; i++) {
            let eleSelect = document.querySelector("[reporttype=" + reportkeys[i].toLowerCase() + "]");
            if (eleSelect != null) {

                let reportdata = new Report.ReportDataClass();

                //引数で設定された値がある場合はそちらをセット（第一優先）
                if (reportOption[reportkeys[i]] != null) {
                    reportdata = reportOption[reportkeys[i]];
                }
                reportdata.element = eleSelect;

                let groupFlag = false;
                if (reportkeys[i].substring(0, 5).toLowerCase() == "group") {
                    groupFlag = true;
                }

                let att = eleSelect.getAttribute("reportproperty");

                if (att != null && att.length > 0) {
                    //↓ this error  look reportproperty not json 
                    //sample  reportproperty="{'DetailRepeatCount':'100','HideDuplicatesField':['xxx1','xxx2']}
                    let obj = JSON.parse(att.replace(/'/g, "\""));

                    let propertyvalue;

                    if (reportdata.DetailRepeatCount == null) {
                        propertyvalue = obj.DetailRepeatCount;
                        if (propertyvalue != null) {
                            reportdata.DetailRepeatCount = propertyvalue;
                        }
                    }

                    if (reportdata.BindField == null) {
                        propertyvalue = obj.BindField;
                        if (propertyvalue != null) {
                            reportdata.BindField = propertyvalue;
                        }
                    }

                    if (reportdata.IsPageRepert == null) {
                        propertyvalue = obj.IsPageRepert;
                        if (propertyvalue != null && propertyvalue.toLocaleLowerCase() == "true") {
                            reportdata.IsPageRepert = true;
                        }
                    }

                    if (reportdata.IsBreakPage == null) {
                        propertyvalue = obj.IsBreakPage;
                        if (propertyvalue != null && propertyvalue.toLocaleLowerCase() == "true") {
                            reportdata.IsBreakPage = true;
                        }
                    }

                    propertyvalue = obj.HideDuplicatesField;
                    if (propertyvalue != null) {
                        reportdata.HideDuplicatesField = propertyvalue;
                    }

                    if (reportdata.IsPageReset == null) {
                        propertyvalue = obj.IsPageReset;
                        if (propertyvalue != null && propertyvalue.toLocaleLowerCase() == "true") {
                            reportdata.IsPageReset = true;
                        }
                    }


                    //ちょっと特殊（存在する場合は上書き） 後で処理
                    if (reportdata.IsMergeTable == null) {
                        propertyvalue = obj.IsMergeTable;
                        if (propertyvalue != null) {
                            if (propertyvalue.toLocaleLowerCase() == "true") {
                                reportdata.IsMergeTable = true;
                            }
                            else {
                                reportdata.IsMergeTable = false;
                            }
                        }
                    }
                }

                //property No Setting
                if (reportdata.DetailRepeatCount == null) {
                    reportdata.DetailRepeatCount = 0;
                }
                if (reportdata.BindField == null) {
                    reportdata.BindField = "";
                }
                if (reportdata.IsPageRepert == null) {
                    reportdata.IsPageRepert = false;
                }
                if (reportdata.IsBreakPage == null) {
                    reportdata.IsBreakPage = false;
                }
                if (reportdata.HideDuplicatesField == null) {
                    reportdata.HideDuplicatesField = [];
                }
                if (reportdata.IsPageReset == null) {
                    reportdata.IsPageReset = false;
                }


                if (Array.isArray(reportdata.HideDuplicatesField) == false) {
                    alert('developError:NotArray');
                    return;
                }

                reportdata.isFirstMergeTable = false;

                let table = eleSelect.querySelector("table");

                //reportdata.IsMergeTable = false;            
                if ((reportdata.IsMergeTable == true || reportdata.IsMergeTable == null) && table != null) {
                    reportdata.IsMergeTable = true;

                    reportdata.tableElement = table;
                    reportdata.headerElement = table.querySelector("thead");
                    reportdata.detailElement = table.querySelector("tbody");
                    reportdata.footerElement = table.querySelector("tfoot");
                    if (reportkeys[i].toLowerCase() == "detail".toLocaleLowerCase() && reportdata.detailElement == null) {
                        //tbody がないのでエラー
                        alert('developError:NotbodyTag')
                        return;
                    }
                }
                else {
                    reportdata.IsMergeTable = false;
                    reportdata.headerElement = eleSelect.querySelector("header");
                    reportdata.footerElement = eleSelect.querySelector("footer");

                    reportdata.detailElement = reportdata.element;
                }


                report[reportkeys[i]] = reportdata;
                if (groupFlag == true) {
                    groupArray.push(reportdata);
                }
            }
        }
    }
    init();

    if (report.Detail == null) {
        //詳細データがない
        alert('developError:NoDetail')
        return;
    }

    //最初のIsMergeTableを取得
    for (let i = 0; i < reportkeys.length ; i++) {
        let reportdata = report[reportkeys[i]];

        if (reportdata != null) {
            if (reportdata.IsMergeTable == true) {
                reportdata.isFirstMergeTable = true;
                break;
            }
        }

    }

    let section = document.createElement("section");
    section.classList.add('sheet');

    let marginCss = reportOption["MarginCss"] || "";
    if (marginCss.length > 0) {
        section.classList.add(marginCss);
    }

    //section.innerHTML = "新しい要素";
    body.appendChild(section);

    let pageHeightPX = document.defaultView.getComputedStyle(section, null).height;
    //alert(new_ele.clientHeight);    //マージン含む
    //alert(new_ele.offsetHeight);    //線含む

    let userAgent = window.navigator.userAgent.toLowerCase();

    let pageHeightMinus = 0;

    //chromeの場合paddingをマイナスする(heightはpaddingを含まないはずなんだけど chromeの不具合？)
    if (userAgent.indexOf("chrome") != -1) {
        pageHeightMinus =
            +(document.defaultView.getComputedStyle(section, null).paddingTop.replace("px", ""))
            +
            +(document.defaultView.getComputedStyle(section, null).paddingBottom.replace("px", ""));
    }

    body.removeChild(section);      //一旦削除

    //高さの取得 https://q-az.net/without-jquery-innerheight-width-outerheight-width/

    //マージン含まない高さ(小数点切り捨て)
    let pageHeight = Math.floor(+(pageHeightPX.replace("px", ""))) - Math.floor(pageHeightMinus);

    //データの置換
    const replaceData = function (ele, data) {
        //[[xxxxx]] を置換
        let html = ele.innerHTML;

        let keys = Object.keys(data);
        for (let i = 0; i < keys.length; i++) {

            //存在しないものは無視
            if (PageDataObject.KeyBindList.indexOf(keys[i]) == -1) {
                continue;
            }

            //最初に 連結項目の存在チェック で同じ正規表現使っているので変更する場合は注意！
            html = html.replace(new RegExp("(\\[\\[(" + keys[i] + "|" + keys[i] + "(\\s)*\\|\\|.+?)\\]\\])", "g"),
                function (all) {

                    let field = all.replace(/\[\[/g, "").replace(/\]\]/g, "").replace(/\s/g, "");

                    let value = "";

                    //format指定
                    if (field.toString().indexOf("||") > -1) {
                        let fieldArray = field.split("||");

                        value = DoraFormat.ParseFormat((data[fieldArray[0]] || ""), fieldArray[1]);
                    }
                    else {
                        value = (data[field] || "");
                    }

                    return escape_html(value);
                }
            )
        }

        let reg = "\\[\\[.+?\\]\\]";
        if (pageFlag == true) {
            html = html.replace(new RegExp(reg, "g"),
                    function (all) {
                        if (all == "[[page]]" || all == "[[pages]]") {
                            return all;
                        }

                        return "";
                    }
                ); 
        }
        else{
            //マッチしないものは強制的に""に変更
            //html = html.replace(new RegExp("\\[\\[.+?\\]\\]", "g"), "");    //&nbsp; でもよいのだけど input tagとかに入れる場合も考慮
            html = html.replace(new RegExp(reg, "g"), "");
        }
        ele.innerHTML = html;
    };

    //escape
    //https://qiita.com/saekis/items/c2b41cd8940923863791
    const escape_html = function (string) {
        if (typeof string !== 'string') {
            return string;
        }
        return string.replace(/[&'`"<>]/g, function (match) {
            return {
                '&': '&amp;',
                "'": '&#x27;',
                '`': '&#x60;',
                '"': '&quot;',
                '<': '&lt;',
                '>': '&gt;',
            }[match];
        });
    };

    //Elementの追加
    const addElement = function (fet, reportdata, groupName, ele, replaceCurrentData) {

        if (groupName.length > 0) {
            if (PageDataObject.PageExecuteManage.indexOf(groupName) > -1) {
                //削除
                PageDataObject.PageExecuteManage.splice(PageDataObject.PageExecuteManage.indexOf(groupName), 1);
                return;
            }
        }

        let tableFlag = reportdata.IsMergeTable;

        //存在しない場合はNewElementを追加
        let appendFlag = false;
        if (reportdata.findElementName != null && reportdata.findElementName.length > 0) {
            let appendEle = PageDataObject.CurrentPageDetail.querySelector("[" + reportdata.findElementName + "]");
            if (appendEle == null) {
                appendFlag = true;
            }
        }
        let new_pageEle = null;
        if (appendFlag && reportdata.newElement != null) {
            new_pageEle = reportdata.newElement;
            if (tableFlag) {
                if (PageDataObject.CurrentTableHeader != null) {
                    //テンプレートより置換
                    replaceData(PageDataObject.CurrentTableHeader, PageDataObject.CurrentData);

                    //イベント発行
                    if (report.Detail.FormatEventFunction != null) {
                        report.Detail.FormatEventFunction(FormatEventType.Header, PageDataObject.CurrentTableHeader, PageDataObject.CurrentData);
                    }

                }
            }

            PageDataObject.CurrentPageDetail.appendChild(new_pageEle);
        }

        //テンプレートより置換
        replaceCurrentData = replaceCurrentData || PageDataObject.CurrentData;
        replaceData(ele, replaceCurrentData);

        //イベント発行
        if (reportdata.FormatEventFunction != null) {
            reportdata.FormatEventFunction(fet, ele, replaceCurrentData);
        }

        //let eleHeight = 0;
        let eleArray = null;
        let apdEle = reportdata.appendElement;

        if (tableFlag) {
            eleArray = ele.querySelectorAll("tr");

            if (eleArray.length > 0) {
                for (let index = 0; index < eleArray.length; index++) {
                    apdEle.appendChild(eleArray[index]);
                }
            }

        }
        else {
            apdEle.appendChild(ele);
        }

        //改ページ分を超えた場合(pagebreak)★（似たような記述あり）
        if (PageDataObject.BreakPageHeight < +(PageDataObject.CurrentPageDetail.offsetHeight)) {

            if (eleArray != null) {
                for (let index = 0; index < eleArray.length; index++) {
                    apdEle.removeChild(eleArray[index]);
                }
            }
            else {
                apdEle.removeChild(ele);
            }

            //new_pageEleを追加してページが超える場合は、new_pageEleも削除
            if (new_pageEle != null) {
                PageDataObject.CurrentPageDetail.removeChild(new_pageEle);
            }

            PageDataObject.IsPageAutoBreak = true;

            PageDataObject.LoopCount--; //次のループでカウントアップされるのでマイナスしておく
            if (PageDataObject.LoopCount >= 0 && PageDataObject.ExistsDetail == false) {
                PageDataObject.CurrentData = PageDataObject.ALLData[PageDataObject.LoopCount];
            }

            //フッターをセット
            PageDataObject.AddFooterFunc();

            //改ページ処理
            //PageDataObject.AddPageFunc();
        }
        else {
            PageDataObject.PageDataCount++;
            if (groupName.length > 0) {
                PageDataObject.PageExecuteManage.push(groupName);
            }
        }
    };

    let dataLoopCount = PageDataObject.ALLData.length;
    //let existsDetail = false;

    let pageBreakFlag = false;
    let prevData = null;
    let pageResetExistsFlag = false;

    //データのループ（MainLoop） ★★★メイン処理★★★
    for (PageDataObject.LoopCount = 0; PageDataObject.LoopCount < dataLoopCount ; PageDataObject.LoopCount++) {
        let currentPageAutoBreak = PageDataObject.IsPageAutoBreak;

        if (currentPageAutoBreak == false) {
            PageDataObject.PageExecuteManage = [];
            currentPageAutoBreak = pageBreakFlag;
        }

        pageBreakFlag = false;

        PageDataObject.CurrentData = PageDataObject.ALLData[PageDataObject.LoopCount];

        let lastFlag = false;
        if ((PageDataObject.LoopCount == (dataLoopCount - 1))) {
            lastFlag = true;
        }

        //改ページ
        if (PageDataObject.LoopCount == 0 || currentPageAutoBreak) {
            prevData = null;
            PageDataObject.AddPageFunc();
        }

        PageDataObject.ExistsDetail = false;

        //★★GroupHeaderの処理★★
        let groupVisble = false;
        for (let reportdataIndex in groupArray) {
            let reportdata = groupArray[reportdataIndex];

            if (groupVisble == false) {
                //改ページ時に再度表示
                if ((PageDataObject.LoopCount == 0) || (currentPageAutoBreak == true && reportdata.IsPageRepert)) {
                    groupVisble = true;
                }
                else {
                    //データが異なる場合（グループのブレーク）
                    if (reportdata.BindField.length != 0) {
                        if (PageDataObject.CurrentData[reportdata.BindField] != PageDataObject.ALLData[PageDataObject.LoopCount - 1][reportdata.BindField]) {
                            groupVisble = true;

                            if (pageFlag == true && reportdata.IsPageReset == true) {
                                let elePageArray = document.querySelectorAll("section");
                                elePageArray[elePageArray.length - 1].setAttribute(GROUP_PAGE_ATTRIBUTE, "");
                                pageResetExistsFlag = true;
                            }
                        }
                    }
                }
            }

            if (groupVisble == true) {
                prevData = null;
                //グループの設定
                if (reportdata.isFirstMergeTable == true) {
                    addGroup(TABLE_ATTRIBUTE + PageDataObject.LoopCount.toString());
                }

                let groupName = "gh" + reportdataIndex;
                if (currentPageAutoBreak == true && reportdata.IsPageRepert) {
                    PageDataObject.PageExecuteManage.splice(PageDataObject.PageExecuteManage.indexOf(groupName), 1);
                }
                

                if (reportdata.headerElement != null) {
                    let new_tableDetail = reportdata.headerElement.cloneNode(true);

                    addElement(FormatEventType.Header, reportdata, groupName, new_tableDetail);
                    if (PageDataObject.IsPageAutoBreak == true) {
                        break;
                    }
                }
            }
        }
        if (PageDataObject.IsPageAutoBreak == true) {
            continue;
        }

        //詳細処理
        let new_tableDetail = report.Detail.detailElement.cloneNode(true);

        //同じデータを非表示
        let replaceCurrentData = null;
        if (report.Detail.HideDuplicatesField.length > 0) {
            if (prevData != null) {
                replaceCurrentData = JSON.parse(JSON.stringify(PageDataObject.CurrentData));
                for (let i = 0 ; i < report.Detail.HideDuplicatesField.length ; i++) {
                    let field = report.Detail.HideDuplicatesField[i];
                    if (replaceCurrentData[field] == prevData[field]) {
                        replaceCurrentData[field] = null;
                    }
                }

            }
            prevData = JSON.parse(JSON.stringify(PageDataObject.CurrentData));
        }

        addElement(FormatEventType.Detail, report.Detail, "detail", new_tableDetail, replaceCurrentData);

        if (PageDataObject.IsPageAutoBreak == true) {
            continue;
        }

        PageDataObject.ExistsDetail = true;

        //★★groupFooter★★
        let dispIndex = 0;
        if (lastFlag == false) {
            dispIndex = groupArray.length;
            for (let reportdataIndex in groupArray) {
                let reportdata = groupArray[reportdataIndex];

                if (reportdata.BindField.length != 0) {
                    if (PageDataObject.CurrentData[reportdata.BindField] != PageDataObject.ALLData[PageDataObject.LoopCount + 1][reportdata.BindField]) {
                        dispIndex = reportdataIndex;
                        break;
                    }
                }
            }
        }

        //groupが大きい方から処理
        for (let reportdataIndex = groupArray.length - 1 ; reportdataIndex >= 0 ; reportdataIndex--) {
            let reportdata = groupArray[reportdataIndex];

            let groupVisble = false;

            if (dispIndex <= reportdataIndex) {
                groupVisble = true;
            }

            if (groupVisble == true) {
                if (reportdata.footerElement != null) {
                    let new_tableDetail = reportdata.footerElement.cloneNode(true);

                    addElement(FormatEventType.Footer,reportdata, "gf" + reportdataIndex, new_tableDetail);
                    if (PageDataObject.IsPageAutoBreak == true) {
                        break;
                    }
                }

                //グループの設定(PageDataObject.CurrentTableFooterの処理)
                if (reportdata.isFirstMergeTable == true) {
                    PageDataObject.AddFooterFunc(true);
                }

                //改ページ処理
                if (reportdata.IsBreakPage) {
                    //フッターをセット
                    PageDataObject.AddFooterFunc();
                    pageBreakFlag = true;
                    break;      //footerを全て出力するのであれば 無視してもよいかも・・
                }
            }
        }

        if (PageDataObject.IsPageAutoBreak == true || pageBreakFlag == true) {
            continue;
        }

        if (lastFlag) {
            PageDataObject.AddFooterFunc();
        }
    }


    //テンプレートデータの削除
    for (let i = 0; i < reportkeys.length ; i++) {
        if (report[reportkeys[i]] != null && report[reportkeys[i]].element != null) {
            body.removeChild(report[reportkeys[i]].element);
        }
    }


    if (pageFlag == true) {
        let elePageArray = document.querySelectorAll("section");

        //グループ毎のページ数
        if (pageResetExistsFlag == true) {
            
            let pageCount = 0;
            let pagesCount = 0;
            for (let index = 0; index < elePageArray.length; index++) {
                if (index == 0 || elePageArray[index].getAttribute(GROUP_PAGE_ATTRIBUTE) != null) {
                    pageCount = 0;
                    
                    //次のGROUP_PAGE_ATTRIBUTEを取得
                    for (pagesCount = index + 1; pagesCount < elePageArray.length; pagesCount++) {
                        if (elePageArray[pagesCount].getAttribute(GROUP_PAGE_ATTRIBUTE) != null) {
                            break;
                        }
                    }
                    pagesCount = pagesCount - index;
                }
                pageCount++;
                replaceData(elePageArray[index], { page: pageCount, pages: pagesCount });
            }

        }
        else {
            //単純なページ数
            for (let index = 0; index < elePageArray.length; index++) {
                replaceData(elePageArray[index], { page: index + 1, pages: elePageArray.length });
            }
        }
    }

    //レポート終了後のfunction
    if (reportOption["ReportEndFunction"] != null) {
        reportOption["ReportEndFunction"]();
    }

    body.style.visibility = "visible";
    body.classList.add("complete"); //pdf作成用

    if (isPrint) {
        window.print();
    }
}



//format用 https://github.com/kaerugit/VuejsTableInput/blob/master/javascript/doracomponent.js から拝借
var DoraFormat = {
    FORMATTYPES: {
        //未設定（文字列）
        none: 0,
        //頭0埋め
        zero: 1,
        //金額
        currency: 2,
        //日付
        date: 3,
        //パーセント
        parcent: 4
    }
    ,
    //小数点
    DECIMAL_SEPARATOR: "."
    ,
    //通貨区切り
    THOUSANDS_SEPARATOR: ","
    ,
}


DoraFormat.GetFormatType = function (formatString) {
    let formattype = DoraFormat.FORMATTYPES.none;

    if (formatString != null && formatString.length > 0) {
        if (formatString.substr(0, 2) == "00") { //if (formatString.startsWith("00")) {                              
            formattype = DoraFormat.FORMATTYPES.zero;
        }
        else if (formatString.substr(-1, 1) == "%") { //if (formatString.endsWith("%")) {      /* パーセント系*/
            formattype = DoraFormat.FORMATTYPES.parcent;
        }
        else if (formatString.indexOf("/") != -1 || formatString.indexOf(":") != -1 || formatString.indexOf(".f") != -1) {  /*日付系*/
            formattype = DoraFormat.FORMATTYPES.date;
        }
        else if (
                formatString.indexOf(DoraFormat.THOUSANDS_SEPARATOR) != -1 ||
                formatString.indexOf(DoraFormat.DECIMAL_SEPARATOR) != -1 ||
                formatString.indexOf("#") != -1 ||
                formatString == "0"
            ) {   /*数値系*/
            formattype = DoraFormat.FORMATTYPES.currency;
        }
    }
    return formattype;
}


/**
* 値(DB)→表示(html)変換
* @param value
* @param formatString
*/
DoraFormat.ParseFormat = function (value, formatString) {

    if (value == null) {
        return null;
    }

    //値をそのまま戻す
    if (formatString == null || formatString.length == 0 || value.toString().length == 0) {
        return value;
    }

    let formattype = DoraFormat.GetFormatType(formatString);

    if (formattype == DoraFormat.FORMATTYPES.none) {
        return value;
    }

    let motoValue = value;
    value = value.toString();
    if (formattype == DoraFormat.FORMATTYPES.parcent) {
        formatString = formatString.replace("%", "");
        value = value.replace("%", "");
    }

    switch (formattype) {
        case DoraFormat.FORMATTYPES.zero:
            if (value.length > 0 && value.length != formatString.length) {

                value = (formatString + value).toString();
                value = value.substr(value.length - formatString.length);

            }

            break;
        case DoraFormat.FORMATTYPES.currency:
        case DoraFormat.FORMATTYPES.parcent:
            //value = value.replace(new RegExp(DoraFormat.THOUSANDS_SEPARATOR, 'g'), "");
            let errorFlag = false;

            //整数と小数にわける
            //let [seisu, shosu = ""] = value.split(DoraFormat.DECIMAL_SEPARATOR);
            let sep = value.split(DoraFormat.DECIMAL_SEPARATOR);
            let seisu = sep[0];
            let shosu = "";
            if (sep.length > 1) {
                shosu = sep[1];
            }

            //let [seisuformat, shosuformat = ""] = formatString.split(DoraFormat.DECIMAL_SEPARATOR);
            sep = formatString.split(DoraFormat.DECIMAL_SEPARATOR);
            let seisuformat = sep[0];
            let shosuformat = "";
            if (sep.length > 1) {
                shosuformat = sep[1];
            }

            //1 → 100 にする
            if (formattype == DoraFormat.FORMATTYPES.parcent && seisu.length > 0) {

                shosu += "000";
                shosu = shosu.substr(0, 2) + DoraFormat.DECIMAL_SEPARATOR + shosu.substr(2);
                value = seisu + shosu;


                //[seisu, shosu = ""] = value.split(DoraFormat.DECIMAL_SEPARATOR);
                sep = value.split(DoraFormat.DECIMAL_SEPARATOR);
                seisu = sep[0];
                shosu = "";
                if (sep.length > 1) {
                    shosu = sep[1];
                }

                let seisuAny = seisu;
                if (isNaN(seisuAny) == true) {
                    errorFlag = true;
                }
                else {
                    seisu = parseInt(seisu).toString();
                }
            }


            if (seisuformat.indexOf(DoraFormat.THOUSANDS_SEPARATOR) != -1) {
                seisu = seisu.replace(/\B(?=(\d{3})+(?!\d))/g, DoraFormat.THOUSANDS_SEPARATOR);       //カンマ区切り

                if (value == "0" && seisuformat.substr(-1, 1) == "#") {
                    seisu = "";
                }
            }

            if (shosuformat.length > 0) {
                shosu = shosu + shosuformat;
                shosu = DoraFormat.DECIMAL_SEPARATOR + shosu.substring(0, shosuformat.length);
            }
            else {
                shosu = "";
            }

            let valueAny = value;

            if (errorFlag == true || isNaN(valueAny) == true) {
                value = motoValue;      //元の値をセット
            }
            else {
                value = seisu + shosu;

                if (formattype == DoraFormat.FORMATTYPES.parcent) {
                    if (value.length > 0 && value.substr(-1, 1) != "%") {
                        value += "%";
                    }
                }
            }
            break;
        case DoraFormat.FORMATTYPES.date:
            //console.log("transform:" + value);
            if (value.length != 0) {
                let dateValuetemp = changeDateValue(value);

                if (dateValuetemp == null || isNaN(+dateValuetemp)) {
                    //value = "";
                }
                else {
                    let dateValue = new Date(+dateValuetemp);

                    value = formatString;
                    let year = dateValue.getFullYear().toString();
                    let month = (dateValue.getMonth() + 1).toString();
                    let day = dateValue.getDate().toString();

                    let hour = dateValue.getHours().toString();
                    let minute = dateValue.getMinutes().toString();
                    let second = dateValue.getSeconds().toString();
                    let milli = dateValue.getMilliseconds().toString() + '000';
                    milli = milli.substr(0, 3);

                    value = value.replace("yyyy", year);
                    value = value.replace("yy", year.substr(2));

                    value = value.replace("MM", month.length == 1 ? "0" + month : month);
                    value = value.replace("M", month);

                    value = value.replace("dd", day.length == 1 ? "0" + day : day);
                    value = value.replace("d", day);

                    value = value.replace("HH", hour.length == 1 ? "0" + hour : hour);
                    value = value.replace("H", hour);

                    value = value.replace("mm", minute.length == 1 ? "0" + minute : minute);
                    value = value.replace("m", minute);

                    value = value.replace("ss", second.length == 1 ? "0" + second : second);
                    value = value.replace("s", second);

                    value = value.replace("fff", milli);


                }
            }
            break;
    }

    return value;

}


function changeDateValue(value) {

    value = value.replace("T", " ");
    value = value.replace("Z", "");
    // / を - に置換
    value = value.replace(/\//g, "-");


    let reg = new RegExp("[^\\:\\-\\s0-9\.]");
    //変な文字を含んでいたら終了
    if (value.match(reg)) {
        return null;
    }

    //ミリ秒をとる
    let millistring = "000";
    let millisep = value.split(".");
    if (millisep.length > 1) {
        value = millisep[0];
        millistring = millisep[1];
    }

    //let [datestring, timestring = ""] = value.split(" ");
    let sep = value.split(" ");
    let datestring = sep[0];
    let timestring = "";
    if (sep.length > 1) {
        timestring = sep[1];
    }


    let nowDateTime = new Date();

    //年・月・日・曜日を取得する
    let year = nowDateTime.getFullYear().toString();
    let month = (nowDateTime.getMonth() + 1).toString();
    //var week = nowDateTime.getDay().toString();
    let day = nowDateTime.getDate().toString();

    let hour = "0";//= nowDateTime.getHours().toString();
    let minute = "0";// = nowDateTime.getMinutes().toString();
    let second = "0";//= nowDateTime.getSeconds().toString();

    //時刻のみ
    if (value.indexOf(":") != -1 && timestring.length == 0) {
        year = "1900";
        month = "1";
        day = "1";
        timestring = datestring;
        datestring = "";
    }


    if (datestring.length > 0) {
        let arr = datestring.split("-");

        if (arr.length == 2) {
            if (arr[0].length == 4) {   //4桁の場合は　年/月とみなす
                year = arr[0];
                month = arr[1];
                day = "1";
            }
            else {      //こちらは　月、日とみなす
                month = arr[0];
                day = arr[1];
            }
        }
        else if (arr.length == 3) {      //年月日入っている場合
            if (arr[0].length == 2) {
                year = year.substring(0, 2) + arr[0];
            }
            else {
                year = arr[0];
            }

            month = arr[1];
            day = arr[2];
        }
        else {
            return null;
        }
    }

    if (timestring.length > 0) {
        let arr = timestring.split(":");
        if (arr.length == 2) {
            hour = arr[0];
            minute = arr[1];
            second = "0";
        }
        else if (arr.length == 3) {
            hour = arr[0];
            minute = arr[1];
            second = arr[2];

        }
        else {
            return null;
        }
    }

    nowDateTime = new Date(year, parseInt(month) - 1, day, hour, minute, second, millistring);

    //時刻型かどうかの確認
    if (parseInt(nowDateTime.getFullYear()) != parseInt(year)) {
        return null;
    }

    if (parseInt(nowDateTime.getMonth() + 1) != parseInt(month)) {
        return null;
    }

    if (parseInt(nowDateTime.getDate()) != parseInt(day)) {
        return null;
    }

    if (parseInt(nowDateTime.getHours()) != parseInt(hour)) {
        return null;
    }

    if (parseInt(nowDateTime.getMinutes()) != parseInt(minute)) {
        return null;
    }

    if (parseInt(nowDateTime.getSeconds()) != parseInt(second)) {
        return null;
    }

    if (parseInt(nowDateTime.getMilliseconds()) != parseInt(millistring)) {
        return null;
    }


    return nowDateTime.getTime();

}

