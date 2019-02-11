var Report = {};

var FormatEventType = {
    Header: 100,
    Footer: 200,
    Detail: 0,
    /*詳細空白行*/
    DetailBlank: 10,
};

Report.ReportDataClass = function () {

    //◆◆pravate◆◆
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

    //改ページの場合、データを繰り返し表示
    this.IsPageRepert = null;

    //改ページ（複数は不可） 複数必要な場合はjsonで対応しておくこと
    this.IsBreakPage = null;

    this.FormatEventFunction = null //function (fet, ele, data) {}
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
 * tabletag not Merge : false 
 * テーブルタグをマージしない場合：false 
 * @param reportOption {ReportDataClass} - 
 * @param isPrint {bool} - true:window.print() run(実行);
 */
Report.Run = function (reportOption,isPrint) {
    outPutData = reportOption["Data"];

    if (outPutData == null || outPutData.length == 0) {
        return;
    }

    //親の要素
    const PARENT_ATTRIBUTE = "oya";
    const TABLE_ATTRIBUTE = "tableappend";

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
                    if (reportkeys[i].toLowerCase() == "Detail".toLocaleLowerCase() && reportdata.detailElement == null) {
                        //tbody
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

    //データの置換
    const replaceData = function (ele, data) {
        //[[xxxxx]] を置換
        let html = ele.innerHTML;

        let keys = Object.keys(data);
        for (let i = 0; i < keys.length; i++) {
            //html = html.replace(new RegExp("\\[\\[" + keys[i] + "\\]\\]", "g"),(data[keys[i]] || ""));

            html = html.replace(new RegExp("(\\[\\[" + keys[i] + "\\]\\])", "g"),
                function (all) {
                    let ret = (data[keys[i]] || "");
                    return escape_html(ret);
                }
            )
        }
        //マッチしないものは強制的に""に変更
        html = html.replace(new RegExp("\\[\\[.+?\\]\\]", "g"), "");    //&nbsp; でもよいのだけど input tagとかに入れる場合も考慮


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
        //if (replaceCurrentData) {
        //    let aa = 'ss';
        //}
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

    };

    let dataLoopCount = PageDataObject.ALLData.length;
    //let existsDetail = false;

    let pageBreakFlag = false;
    let prevData = null;

    //データのループ（MainLoop）
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
                    if (reportdata.BindField.length != 0) {
                        if (PageDataObject.CurrentData[reportdata.BindField] != PageDataObject.ALLData[PageDataObject.LoopCount - 1][reportdata.BindField]) {
                            groupVisble = true;
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
                replaceCurrentData["NoneOrSolid"] = "none";
                for (let i = 0 ; i < report.Detail.HideDuplicatesField.length ; i++) {
                    let field = report.Detail.HideDuplicatesField[i];
                    if (replaceCurrentData[field] == prevData[field]) {
                        replaceCurrentData[field] = null;

                        replaceCurrentData["NoneOrSolid"] = "solid";
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

    body.style.visibility = "visible";

    if (isPrint) {
        window.print();
    }
}
