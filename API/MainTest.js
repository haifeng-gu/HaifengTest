const bodyParser = require('body-parser');
const express = require('express');
const CircuitDao = require("./dao/circuitDao");
const ClrEntryDao = require("./dao/clrEntryDao");
const http = require('http');
const fs = require('fs');
const url = require('url');
const json2html = require('node-json2html');

const circuitDao = new CircuitDao();
const clrEntryDao = new ClrEntryDao();

var circuitDetailsHtmlTemp = "";
var clrHtmlTemp = "";
var clrEditHtmlTemp = "";

fs.readFile('html/CircuitDetails.html', function (err, data) {
    if (err) {
        throw err;
    }
    circuitDetailsHtmlTemp = data.toString();
    console.log("read file");
    console.log("Read html/CircuitDetails.html:" + data.toString());
});

fs.readFile('html/ClrReport.html', function (err, data) {
    if (err) {
        throw err;
    }
    clrHtmlTemp = data.toString();
    console.log("read file");
    console.log("Read html/ClrReport.html:" + data.toString());
});

fs.readFile('html/ClrReportEdit.html', function (err, data) {
    if (err) {
        throw err;
    }
    clrEditHtmlTemp = data.toString();
    console.log("read file");
    console.log("Read html/ClrReportEdit.html:" + data.toString());
});

const testDao = async () => {

    //result = await circuitDao.getBranchesByCircuitName("6FDDZ318345000ABGT");
    //console.log("Result --> ", result)
    //result = await circuitDao.getBranchesByCircuitName("6PADT267425000ABGT");
    //console.log("Result --> ", result)
    //result = await circuitDao.getBranchesByCircuitName("NXFDDA838779000ABGT");
    //console.log("Result --> ", result)

}

//testDao();


const webapp = express();
const port = 5000;


webapp.get('/api/getBranchesByCircuitName', async (req, res) => {
    var q = url.parse(req.url, true);
    console.log(q.pathname);
    console.log(q.query.circuitName); //returns circuitName : '6FDDZ318345000ABGT'
    let result = await circuitDao.getBranchesByCircuitName(q.query.circuitName);    
    console.log(JSON.stringify(result));
    res.send(JSON.stringify(result));
});

webapp.get('/api/getClrReportByBranch', async (req, res) => {
    var q = url.parse(req.url, true);
    console.log(q.pathname);
    let result = await clrEntryDao.getClrEntiresByBranch(q.query);    
    console.log(JSON.stringify(result));
    res.send(JSON.stringify(result));
});

webapp.post('/api/world', (req, res) => {
    res.send(
        'I received your POST request. '
    );
});



webapp.get('/CircuitDetails.html', async (req, res) => {
    var q = url.parse(req.url, true);
    console.log(q.pathname);
    console.log(q.query.circuitName); //returns circuitName : '6FDDZ318345000ABGT'
    let htmltext = "" + circuitDetailsHtmlTemp;
    console.log("htmltext length =" + htmltext.length);
    if (q.query.circuitName != null)
        htmltext = htmltext.replace(/#circuitName/g, q.query.circuitName.toString());
    else
        htmltext = htmltext.replace(/#circuitName/g, "");
    let result = await circuitDao.getBranchesByCircuitName(q.query.circuitName);
    circuirDetailHtmlFrag = convertCircuitDataToHtmlFrag(result);
    //console.log(circuirDetailHtmlFrag);
    htmltext = htmltext.replace(/#circuitDetails/g, circuirDetailHtmlFrag);
    res.send(htmltext);
});


webapp.get('/ClrReport.html', async (req, res) => {
    var q = url.parse(req.url, true);
    console.log(q.pathname);
    let clrHeader = '<p>Circuit ID: ' + q.query.circuit + '</p>'
        + "<p>BR Node: " + q.query.brNode + "</p>"
        + "<p>Branch: " + q.query.branch + "</p>"
        + "<p>Branch Version: " + q.query.version + "</p>"
        + "<p>Revision: 0" + " &nbsp&nbsp"
        + "<a href=\"ClrReportEdit.html?circuit=" + q.query.circuit + "&brNode=" + q.query.brNode + "&branch=" + q.query.branch + "&version=" + q.query.version + "\"> Edit</a></p>";
    let htmltext = clrHtmlTemp.replace(/#clrHeader/g, clrHeader);
    let result = await clrEntryDao.getClrEntiresByBranch(q.query);
    let clrDetailHtmlFrag = convertClrDataToHtmlFrag(result);
    //console.log(clrDetailHtmlFrag);
    htmltext = htmltext.replace(/#clrDetails/g, clrDetailHtmlFrag);
    res.send(htmltext);
 
});


webapp.get('/ClrReportEdit.html', async (req, res) => {
    var q = url.parse(req.url, true);
    console.log(q.pathname);
    let clrHeader = '<p>Circuit ID: ' + q.query.circuit + '</p>'
        + "<p>BR Node: " + q.query.brNode + "</p>"
        + "<p>Branch: " + q.query.branch + "</p>"
        + "<p>Branch Version Version: " + q.query.version + "</p>"
        + "<p>Revision: 1" + " </p>";
    let htmltext = clrEditHtmlTemp.replace(/#clrHeader/g, clrHeader);
    let result = await clrEntryDao.getClrEntiresByBranch(q.query);
    let clrDetailEditHtmlFrag = convertClrEditDataToHtmlFrag(result);
    //console.log(clrDetailEditHtmlFrag);
    htmltext = htmltext.replace(/#clrDetails/g, clrDetailEditHtmlFrag);
    //            console.log(htmltext);
    res.send(htmltext);

});

function convertCircuitDataToHtmlFrag(sqlResult) {

    let transform = {
        '<>': 'div', 'html': '<tr><td>${BR_NODE_ID}</td><td>${BR_ID}</td><td>${BR_VRSN_NO}</td><td>${BR_VRSN_TYP_CODE}</td><td> <a href="ClrReport.html?circuit=${CKT_ID}&brNode=${BR_NODE_ID}&branch=${BR_ID}&version=${BR_VRSN_NO}">See CLR Report</a></td><tr>'
    };

    let html = json2html.transform(sqlResult, transform);
    //console.log("after transform");
    //console.log(html);
    return html;
}

function convertClrDataToHtmlFrag(sqlResult) {
    //let format = '<table><tr><td>TLP Seq#: ${TSTLP_SEQ_NO}</td><td>CLLI: ${CLLI_ID}</td><td>A-Z: ${EDQ_ID_TRMT_NEW} (${EDQ_TYP_TRMT_NEW})</td><td> Z-A: ${EDQ_ID_RCV_NEW} (${EDQ_TYP_RCV_NEW}) </td></tr> '
    //    + '<tr><td></td><td></td><td>${AZ_DETAIL}</td><td>${ZA_DETAIL}</td></tr></table>';
    let format = '<tr><td>${TSTLP_SEQ_NO}</td><td>${CLLI_ID}</td><td>${EDQ_ID_TRMT_NEW}(${EDQ_TYP_TRMT_NEW})</td><td>${EDQ_ID_RCV_NEW}(${EDQ_TYP_RCV_NEW})</td></tr> '
        + '<tr><td></td><td></td><td>${AZ_DETAIL}</td><td>${ZA_DETAIL}</td></tr>';

    let transform = '{ "<>": "div", "html":"' + format + '"}';
    let html = json2html.transform(sqlResult, JSON.parse(transform));
    return html;
}

function convertClrEditDataToHtmlFrag(sqlResult) {
    let format = " <tr><td contenteditable='true'>${TSTLP_SEQ_NO}</td>"
        + "<td contenteditable = 'true' >${CLLI_ID}</td>"
        + "<td contenteditable = 'true' >${EDQ_ID_TRMT_NEW} </td>"
        + "<td contenteditable = 'true' >${EDQ_TYP_TRMT_NEW} </td>"
        + "<td contenteditable = 'true' >${AZ_DETAIL} </td>"
        + "<td contenteditable = 'true' >${EDQ_ID_RCV_NEW} </td>"
        + "<td contenteditable = 'true' >${EDQ_TYP_RCV_NEW} </td>"
        + "<td contenteditable = 'true' >${ZA_DETAIL} </td>"
        + "<td><span class='table-remove glyphicon glyphicon-remove'> </span> </td>"
        + "<td><span class='table-up glyphicon glyphicon-arrow-up'> </span></td>"
        + "<td><span class='table-down glyphicon glyphicon-arrow-down'> </span > </td > </tr > ";
    //Doesn't work: let format = " <tr><td> ${TSTLP_SEQ_NO} </td>"
    //    + "<td> ${CLLI_ID} </td>"
    //    + "<td> ${EDQ_ID_TRMT_NEW} </td>"
    //    + "<td> ${EDQ_TYP_TRMT_NEW} </td>"
    //    + "<td> ${AZ_DETAIL} </td>"
    //    + "<td> ${EDQ_ID_RCV_NEW} </td>"
    //    + "<td> ${EDQ_TYP_RCV_NEW} </td>"
    //    + "<td> ${ZA_DETAIL} </td>"
    //    + "<td><span class='table-remove glyphicon glyphicon-remove'> </span> </td>"
    //    + "<td><span class='table-up glyphicon glyphicon-arrow-up'> </span></td>"
    //    + "<td><span class='table-down glyphicon glyphicon-arrow-down'> </span > </td > </tr > ";
    //console.log("format:" + format);
    let transform = '{ "<>": "div", "html":"' + format + '"}';
    let html = json2html.transform(sqlResult, JSON.parse(transform));
    return html;
}


webapp.listen(port, () => console.log('Example app listening at http://localhost:${port}'));

