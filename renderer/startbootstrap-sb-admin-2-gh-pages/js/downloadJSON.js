const fs = require('fs');
const {dialog} = require('electron').remote;

// Modules
const {ipcRenderer, app} = require('electron')

const returnPeriod = document.getElementById('returnPeriod');
let btnElement;
let returnType;

// Dom Nodes
function getCaptcha(type, btnObj) {
    btnElement = btnObj;
    returnType = type;
    console.log("in renderer :- getcaptcha");
    if(returnPeriod.value === ""){
        notifyMessage("danger","Validation: Please select return Period");
        returnPeriod.style.border = "1px solid red";
        return false;
    }

    toggleModalButtons(btnObj, "Download JSON");
    ipcRenderer.send('get-captcha');

}

ipcRenderer.on("download-excel-success", (event, res) => {
    toggleModalButtons(btnElement, "Download Excel");
    const response = JSON.parse(res);
    if(checkNested(response, "data", "url")){
        notifyMessage("success",`File Downloaded successfully.Please check your Downloads.`)
    }else{
        notifyMessage("info",response.data.msg)
    }
});

ipcRenderer.on("download-excel-error", (event, res) => {
    toggleModalButtons(btnElement, "Download Excel");
    notifyMessage("danger",`There must be some problem with GSTN. Please try again later.`);
});

ipcRenderer.on("download-pdf-success", (event, res) => {
    toggleModalButtons(btnElement, "Download PDF");
    if(res === "success"){
        notifyMessage("success",`File Downloaded successfully.Please check your Downloads.`)
    }
});

ipcRenderer.on("download-pdf-error", (event, res) => {
    toggleModalButtons(btnElement, "Download PDF");
    notifyMessage("danger",`There must be some problem with GSTN. Please try again later.`);
});

ipcRenderer.on("download-cashLedger-success", (event, res) => {
    toggleModalButtons(btnElement, "Fetch Table Details");
    notifyMessage("success",`Data Fetched Successfully.`)
    if(!isEmpty(res)){
        let response = JSON.parse(res);
        if(checkNested(response,"tr")){
            const data = response.tr;
            createCashLedgerTable(data);
        }
    }
});

ipcRenderer.on("download-cashLedger-error", (event, res) => {
    toggleModalButtons(btnElement, "Download PDF");
    notifyMessage("danger",`There must be some problem with GSTN. Please try again later.`);
});

function setCaptcha(event) {

    //close the modal
    $("#gstnModal").modal("hide");

    toggleModalButtons(btnElement, "Download JSON");

    // event.preventDefault();
    const userName = document.getElementById("userName").value;
    const gstnPassword = document.getElementById("gstnPassword").value;
    const captchaValue = document.getElementById("captchaValue").value;
    console.log("in renderer :- setcaptcha");
    if(returnType === "gstr1"){
        ipcRenderer.send('download-json', userName, gstnPassword, captchaValue, returnPeriod.value, returnType);
    }else if(returnType === "gstr2a"){
        ipcRenderer.send('download-excel', userName, gstnPassword, captchaValue, returnPeriod.value, returnType);
    }else if(returnType === "gstr3b"){
        ipcRenderer.send('download-pdf', userName, gstnPassword, captchaValue, returnPeriod.value, returnType);
    }else if(returnType === "cashLedger"){
        ipcRenderer.send('download-cashLedger', userName, gstnPassword, captchaValue, returnPeriod.value, returnType);
    }

}

ipcRenderer.on('get-captcha-success', (e, response) => {
    let btnName;
    if(returnType === "gstr1"){
        btnName = "Download JSON";
    }else if(returnType === "gstr2a"){
        btnName = "Download Excel";
    }else if(returnType === "gstr3b"){
        btnName = "Download PDF";
    }else if(returnType === "cashLedger"){
        btnName = "Fetch Table Details";
    }

    toggleModalButtons(btnElement, btnName);

    if(response === "success"){
    $("#captcha").attr("src","../../captcha.png");
        $("#gstnModal").modal("show");
    }else{
        notifyMessage("danger", "There must be some problem with GSTN. Please try again later");
    }
});

ipcRenderer.on('set-captcha-success', (e, res) => {
    toggleModalButtons(btnElement);
    console.log(res);
    if(!isEmpty(res) ){
        let response = JSON.parse(res);
        if(checkNested(response, "data") && !isEmpty(response.data)){
            let content = response.data;
            const options = {
                title: "Save file",
                defaultPath : returnType + ".json",
                buttonLabel : "Save",
                filters :[
                    {name: 'json', extensions: ['json']},
                ]
            }
            dialog.showSaveDialog(options,(fileName) => {
                if (isEmpty(fileName)){
                    notifyMessage("danger","You didn't save the file");
                    console.log("You didn't save the file");
                    return;
                }

                // fileName is a string that contains the path and filename created in the save file dialog.
                fs.writeFile(fileName, JSON.stringify(content), (err) => {
                    if(err){
                        alert("An error ocurred creating the file "+ err.message)
                    }

                    notifyMessage("success","The file has been successfully saved");
                });
            });
        }else{
            notifyMessage("danger", "There must be some problem with GSTN. Please try again later");
        }
    }else{
        notifyMessage("danger", "There must be some problem with GSTN. Please try again later")
    }

});

// Show modal
returnPeriod.addEventListener('change', e => {
    if(e.target.value === ""){
        returnPeriod.style.border = "1px solid red";
    } else {
        returnPeriod.style.border = "";
    }
});

const toggleModalButtons = (btnObj, name) => {
    // Check state of buttons
    if (btnObj.disabled === false) {
        $(btnObj).prop("disabled", true);
        $(btnObj).html(
            `<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Loading...`
        );
    } else {
        $(btnObj).prop("disabled", false);
        $(btnObj).html(
            `<i class="fas fa-download fa-sm text-white-50"></i> ${name}`
        );
    }
}

$("#gstnPortalForm").validate(
    {
        rules : {
            userName : {
                required : true,
            },
            gstnPassword : {
                required : true,
            },
            captchaValue : {
                required : true,
            }
        },
        messages : {
            userName : {
                required : "Enter GSTN Portal User name",
            },
            gstnPassword : {
                required : "Enter GSTN Portal Password",
            },
            captchaValue : {
                required : "Enter Captcha Value",
            }
        },
        submitHandler : function(form) {
            setCaptcha();
        }
    });

function getValue(obj, key) {
    return checkNested(obj, key) ? obj[key] : "-";
}

function createCashLedgerTable(data){
    // let data = '{"fr_dt":"01/01/2020","to_dt":"24/04/2020","gstin":"27BHVPS5306N1ZF","tr":[{"ret_period":"-","sgst":{"intr":0,"oth":0,"tx":0,"fee":0,"pen":0,"tot":0},"igstbal":{"intr":0,"oth":0,"tx":0,"fee":0,"pen":0,"tot":0},"sgstbal":{"intr":0,"oth":0,"tx":0,"fee":0,"pen":0,"tot":0},"cessbal":{"intr":0,"oth":0,"tx":0,"fee":0,"pen":0,"tot":0},"cgst":{"intr":0,"oth":0,"tx":0,"fee":0,"pen":0,"tot":0},"cess":{"intr":0,"oth":0,"tx":0,"fee":0,"pen":0,"tot":0},"tot_tr_amt":0,"tot_rng_bal":0,"cgstbal":{"intr":0,"oth":0,"tx":0,"fee":0,"pen":0,"tot":0},"igst":{"intr":0,"oth":0,"tx":0,"fee":0,"pen":0,"tot":0},"desc":"Opening Balance"},{"sgst":{"intr":0,"oth":0,"tx":90000,"fee":30000,"pen":0,"tot":120000},"refNo":"MIDDLE25022000904","dpt_dt":"25/02/2020","sgstbal":{"intr":0,"oth":0,"tx":90000,"fee":30000,"pen":0,"tot":120000},"cessbal":{"intr":0,"oth":0,"tx":0,"fee":0,"pen":0,"tot":0},"ref_no":"MIDDLE25022000904","cgst":{"intr":0,"oth":0,"tx":90000,"fee":30000,"pen":0,"tot":120000},"cess":{"intr":0,"oth":0,"tx":0,"fee":0,"pen":0,"tot":0},"tot_rng_bal":240000,"igst":{"intr":0,"oth":0,"tx":0,"fee":0,"pen":0,"tot":0},"tr_typ":"Cr","ret_period":"-","rpt_dt":"25/02/2020","igstbal":{"intr":0,"oth":0,"tx":0,"fee":0,"pen":0,"tot":0},"dpt_time":"00:00:00","tot_tr_amt":240000,"cgstbal":{"intr":0,"oth":0,"tx":90000,"fee":30000,"pen":0,"tot":120000},"desc":"Amount deposited"},{"sgst":{"intr":0,"oth":0,"tx":7180,"fee":5000,"pen":0,"tot":12180},"refNo":"DC2702200726721","dpt_dt":"26/02/2020","sgstbal":{"intr":0,"oth":0,"tx":82820,"fee":25000,"pen":0,"tot":107820},"cessbal":{"intr":0,"oth":0,"tx":0,"fee":0,"pen":0,"tot":0},"ref_no":"DC2702200726721","cgst":{"intr":0,"oth":0,"tx":7180,"fee":5000,"pen":0,"tot":12180},"cess":{"intr":0,"oth":0,"tx":0,"fee":0,"pen":0,"tot":0},"tot_rng_bal":215640,"igst":{"intr":0,"oth":0,"tx":0,"fee":0,"pen":0,"tot":0},"tr_typ":"Dr","ret_period":"042019","igstbal":{"intr":0,"oth":0,"tx":0,"fee":0,"pen":0,"tot":0},"tot_tr_amt":24360,"cgstbal":{"intr":0,"oth":0,"tx":82820,"fee":25000,"pen":0,"tot":107820},"desc":"Other than reverse charge"},{"sgst":{"intr":0,"oth":0,"tx":16118,"fee":5000,"pen":0,"tot":21118},"refNo":"DC2702200726846","dpt_dt":"26/02/2020","sgstbal":{"intr":0,"oth":0,"tx":66702,"fee":20000,"pen":0,"tot":86702},"cessbal":{"intr":0,"oth":0,"tx":0,"fee":0,"pen":0,"tot":0},"ref_no":"DC2702200726846","cgst":{"intr":0,"oth":0,"tx":14686,"fee":5000,"pen":0,"tot":19686},"cess":{"intr":0,"oth":0,"tx":0,"fee":0,"pen":0,"tot":0},"tot_rng_bal":174836,"igst":{"intr":0,"oth":0,"tx":0,"fee":0,"pen":0,"tot":0},"tr_typ":"Dr","ret_period":"052019","igstbal":{"intr":0,"oth":0,"tx":0,"fee":0,"pen":0,"tot":0},"tot_tr_amt":40804,"cgstbal":{"intr":0,"oth":0,"tx":68134,"fee":20000,"pen":0,"tot":88134},"desc":"Other than reverse charge"},{"sgst":{"intr":0,"oth":0,"tx":13553,"fee":5000,"pen":0,"tot":18553},"refNo":"DC2702200727028","dpt_dt":"26/02/2020","sgstbal":{"intr":0,"oth":0,"tx":53149,"fee":15000,"pen":0,"tot":68149},"cessbal":{"intr":0,"oth":0,"tx":0,"fee":0,"pen":0,"tot":0},"ref_no":"DC2702200727028","cgst":{"intr":0,"oth":0,"tx":10313,"fee":5000,"pen":0,"tot":15313},"cess":{"intr":0,"oth":0,"tx":0,"fee":0,"pen":0,"tot":0},"tot_rng_bal":140970,"igst":{"intr":0,"oth":0,"tx":0,"fee":0,"pen":0,"tot":0},"tr_typ":"Dr","ret_period":"062019","igstbal":{"intr":0,"oth":0,"tx":0,"fee":0,"pen":0,"tot":0},"tot_tr_amt":33866,"cgstbal":{"intr":0,"oth":0,"tx":57821,"fee":15000,"pen":0,"tot":72821},"desc":"Other than reverse charge"},{"sgst":{"intr":0,"oth":0,"tx":35999,"fee":5000,"pen":0,"tot":40999},"refNo":"DC2702200727170","dpt_dt":"26/02/2020","sgstbal":{"intr":0,"oth":0,"tx":17150,"fee":10000,"pen":0,"tot":27150},"cessbal":{"intr":0,"oth":0,"tx":0,"fee":0,"pen":0,"tot":0},"ref_no":"DC2702200727170","cgst":{"intr":0,"oth":0,"tx":35999,"fee":5000,"pen":0,"tot":40999},"cess":{"intr":0,"oth":0,"tx":0,"fee":0,"pen":0,"tot":0},"tot_rng_bal":58972,"igst":{"intr":0,"oth":0,"tx":0,"fee":0,"pen":0,"tot":0},"tr_typ":"Dr","ret_period":"072019","igstbal":{"intr":0,"oth":0,"tx":0,"fee":0,"pen":0,"tot":0},"tot_tr_amt":81998,"cgstbal":{"intr":0,"oth":0,"tx":21822,"fee":10000,"pen":0,"tot":31822},"desc":"Other than reverse charge"},{"sgst":{"intr":0,"oth":0,"tx":16428,"fee":4700,"pen":0,"tot":21128},"refNo":"DC2702200727268","dpt_dt":"26/02/2020","sgstbal":{"intr":0,"oth":0,"tx":722,"fee":5300,"pen":0,"tot":6022},"cessbal":{"intr":0,"oth":0,"tx":0,"fee":0,"pen":0,"tot":0},"ref_no":"DC2702200727268","cgst":{"intr":0,"oth":0,"tx":16428,"fee":4700,"pen":0,"tot":21128},"cess":{"intr":0,"oth":0,"tx":0,"fee":0,"pen":0,"tot":0},"tot_rng_bal":16716,"igst":{"intr":0,"oth":0,"tx":0,"fee":0,"pen":0,"tot":0},"tr_typ":"Dr","ret_period":"082019","igstbal":{"intr":0,"oth":0,"tx":0,"fee":0,"pen":0,"tot":0},"tot_tr_amt":42256,"cgstbal":{"intr":0,"oth":0,"tx":5394,"fee":5300,"pen":0,"tot":10694},"desc":"Other than reverse charge"},{"sgst":{"intr":0,"oth":0,"tx":0,"fee":3975,"pen":0,"tot":3975},"refNo":"DC2702200727448","dpt_dt":"26/02/2020","sgstbal":{"intr":0,"oth":0,"tx":722,"fee":1325,"pen":0,"tot":2047},"cessbal":{"intr":0,"oth":0,"tx":0,"fee":0,"pen":0,"tot":0},"ref_no":"DC2702200727448","cgst":{"intr":0,"oth":0,"tx":0,"fee":3975,"pen":0,"tot":3975},"cess":{"intr":0,"oth":0,"tx":0,"fee":0,"pen":0,"tot":0},"tot_rng_bal":8766,"igst":{"intr":0,"oth":0,"tx":0,"fee":0,"pen":0,"tot":0},"tr_typ":"Dr","ret_period":"092019","igstbal":{"intr":0,"oth":0,"tx":0,"fee":0,"pen":0,"tot":0},"tot_tr_amt":7950,"cgstbal":{"intr":0,"oth":0,"tx":5394,"fee":1325,"pen":0,"tot":6719},"desc":"Other than reverse charge"},{"sgst":{"intr":0,"oth":0,"tx":10964,"fee":1900,"pen":0,"tot":12864},"refNo":"MIDDLE26022000588","dpt_dt":"26/02/2020","sgstbal":{"intr":0,"oth":0,"tx":11686,"fee":3225,"pen":0,"tot":14911},"cessbal":{"intr":0,"oth":0,"tx":0,"fee":0,"pen":0,"tot":0},"ref_no":"MIDDLE26022000588","cgst":{"intr":0,"oth":0,"tx":6292,"fee":1900,"pen":0,"tot":8192},"cess":{"intr":0,"oth":0,"tx":0,"fee":0,"pen":0,"tot":0},"tot_rng_bal":29822,"igst":{"intr":0,"oth":0,"tx":0,"fee":0,"pen":0,"tot":0},"tr_typ":"Cr","ret_period":"-","rpt_dt":"26/02/2020","igstbal":{"intr":0,"oth":0,"tx":0,"fee":0,"pen":0,"tot":0},"dpt_time":"00:00:00","tot_tr_amt":21056,"cgstbal":{"intr":0,"oth":0,"tx":11686,"fee":3225,"pen":0,"tot":14911},"desc":"Amount deposited"},{"sgst":{"intr":0,"oth":0,"tx":11686,"fee":3225,"pen":0,"tot":14911},"refNo":"DC2702200730473","dpt_dt":"26/02/2020","sgstbal":{"intr":0,"oth":0,"tx":0,"fee":0,"pen":0,"tot":0},"cessbal":{"intr":0,"oth":0,"tx":0,"fee":0,"pen":0,"tot":0},"ref_no":"DC2702200730473","cgst":{"intr":0,"oth":0,"tx":11686,"fee":3225,"pen":0,"tot":14911},"cess":{"intr":0,"oth":0,"tx":0,"fee":0,"pen":0,"tot":0},"tot_rng_bal":0,"igst":{"intr":0,"oth":0,"tx":0,"fee":0,"pen":0,"tot":0},"tr_typ":"Dr","ret_period":"102019","igstbal":{"intr":0,"oth":0,"tx":0,"fee":0,"pen":0,"tot":0},"tot_tr_amt":29822,"cgstbal":{"intr":0,"oth":0,"tx":0,"fee":0,"pen":0,"tot":0},"desc":"Other than reverse charge"},{"sgst":{"intr":0,"oth":0,"tx":27698,"fee":2450,"pen":0,"tot":30148},"refNo":"MIDDLE10032000430","dpt_dt":"10/03/2020","sgstbal":{"intr":0,"oth":0,"tx":27698,"fee":2450,"pen":0,"tot":30148},"cessbal":{"intr":0,"oth":0,"tx":0,"fee":0,"pen":0,"tot":0},"ref_no":"MIDDLE10032000430","cgst":{"intr":0,"oth":0,"tx":27698,"fee":2450,"pen":0,"tot":30148},"cess":{"intr":0,"oth":0,"tx":0,"fee":0,"pen":0,"tot":0},"tot_rng_bal":60296,"igst":{"intr":0,"oth":0,"tx":0,"fee":0,"pen":0,"tot":0},"tr_typ":"Cr","ret_period":"-","rpt_dt":"10/03/2020","igstbal":{"intr":0,"oth":0,"tx":0,"fee":0,"pen":0,"tot":0},"dpt_time":"00:00:00","tot_tr_amt":60296,"cgstbal":{"intr":0,"oth":0,"tx":27698,"fee":2450,"pen":0,"tot":30148},"desc":"Amount deposited"},{"sgst":{"intr":0,"oth":0,"tx":27698,"fee":2450,"pen":0,"tot":30148},"refNo":"DC2703200093186","dpt_dt":"10/03/2020","sgstbal":{"intr":0,"oth":0,"tx":0,"fee":0,"pen":0,"tot":0},"cessbal":{"intr":0,"oth":0,"tx":0,"fee":0,"pen":0,"tot":0},"ref_no":"DC2703200093186","cgst":{"intr":0,"oth":0,"tx":27698,"fee":2450,"pen":0,"tot":30148},"cess":{"intr":0,"oth":0,"tx":0,"fee":0,"pen":0,"tot":0},"tot_rng_bal":0,"igst":{"intr":0,"oth":0,"tx":0,"fee":0,"pen":0,"tot":0},"tr_typ":"Dr","ret_period":"112019","igstbal":{"intr":0,"oth":0,"tx":0,"fee":0,"pen":0,"tot":0},"tot_tr_amt":60296,"cgstbal":{"intr":0,"oth":0,"tx":0,"fee":0,"pen":0,"tot":0},"desc":"Other than reverse charge"},{"sgst":{"intr":0,"oth":0,"tx":13607,"fee":1950,"pen":0,"tot":15557},"refNo":"MIDDLE10032000437","dpt_dt":"10/03/2020","sgstbal":{"intr":0,"oth":0,"tx":13607,"fee":1950,"pen":0,"tot":15557},"cessbal":{"intr":0,"oth":0,"tx":0,"fee":0,"pen":0,"tot":0},"ref_no":"MIDDLE10032000437","cgst":{"intr":0,"oth":0,"tx":13607,"fee":1950,"pen":0,"tot":15557},"cess":{"intr":0,"oth":0,"tx":0,"fee":0,"pen":0,"tot":0},"tot_rng_bal":31114,"igst":{"intr":0,"oth":0,"tx":0,"fee":0,"pen":0,"tot":0},"tr_typ":"Cr","ret_period":"-","rpt_dt":"10/03/2020","igstbal":{"intr":0,"oth":0,"tx":0,"fee":0,"pen":0,"tot":0},"dpt_time":"00:00:00","tot_tr_amt":31114,"cgstbal":{"intr":0,"oth":0,"tx":13607,"fee":1950,"pen":0,"tot":15557},"desc":"Amount deposited"},{"sgst":{"intr":0,"oth":0,"tx":13607,"fee":1950,"pen":0,"tot":15557},"refNo":"DC2703200093222","dpt_dt":"10/03/2020","sgstbal":{"intr":0,"oth":0,"tx":0,"fee":0,"pen":0,"tot":0},"cessbal":{"intr":0,"oth":0,"tx":0,"fee":0,"pen":0,"tot":0},"ref_no":"DC2703200093222","cgst":{"intr":0,"oth":0,"tx":13607,"fee":1950,"pen":0,"tot":15557},"cess":{"intr":0,"oth":0,"tx":0,"fee":0,"pen":0,"tot":0},"tot_rng_bal":0,"igst":{"intr":0,"oth":0,"tx":0,"fee":0,"pen":0,"tot":0},"tr_typ":"Dr","ret_period":"122019","igstbal":{"intr":0,"oth":0,"tx":0,"fee":0,"pen":0,"tot":0},"tot_tr_amt":31114,"cgstbal":{"intr":0,"oth":0,"tx":0,"fee":0,"pen":0,"tot":0},"desc":"Other than reverse charge"},{"sgst":{"intr":0,"oth":0,"tx":25900,"fee":1250,"pen":0,"tot":27150},"refNo":"MIDDLE12032000674","dpt_dt":"12/03/2020","sgstbal":{"intr":0,"oth":0,"tx":25900,"fee":1250,"pen":0,"tot":27150},"cessbal":{"intr":0,"oth":0,"tx":0,"fee":0,"pen":0,"tot":0},"ref_no":"MIDDLE12032000674","cgst":{"intr":0,"oth":0,"tx":25900,"fee":1250,"pen":0,"tot":27150},"cess":{"intr":0,"oth":0,"tx":0,"fee":0,"pen":0,"tot":0},"tot_rng_bal":54300,"igst":{"intr":0,"oth":0,"tx":0,"fee":0,"pen":0,"tot":0},"tr_typ":"Cr","ret_period":"-","rpt_dt":"12/03/2020","igstbal":{"intr":0,"oth":0,"tx":0,"fee":0,"pen":0,"tot":0},"dpt_time":"00:00:00","tot_tr_amt":54300,"cgstbal":{"intr":0,"oth":0,"tx":25900,"fee":1250,"pen":0,"tot":27150},"desc":"Amount deposited"},{"sgst":{"intr":0,"oth":0,"tx":25900,"fee":1250,"pen":0,"tot":27150},"refNo":"DC2703200117763","dpt_dt":"12/03/2020","sgstbal":{"intr":0,"oth":0,"tx":0,"fee":0,"pen":0,"tot":0},"cessbal":{"intr":0,"oth":0,"tx":0,"fee":0,"pen":0,"tot":0},"ref_no":"DC2703200117763","cgst":{"intr":0,"oth":0,"tx":25900,"fee":1250,"pen":0,"tot":27150},"cess":{"intr":0,"oth":0,"tx":0,"fee":0,"pen":0,"tot":0},"tot_rng_bal":0,"igst":{"intr":0,"oth":0,"tx":0,"fee":0,"pen":0,"tot":0},"tr_typ":"Dr","ret_period":"012020","igstbal":{"intr":0,"oth":0,"tx":0,"fee":0,"pen":0,"tot":0},"tot_tr_amt":54300,"cgstbal":{"intr":0,"oth":0,"tx":0,"fee":0,"pen":0,"tot":0},"desc":"Other than reverse charge"},{"ret_period":"-","sgst":{"intr":0,"oth":0,"tx":0,"fee":0,"pen":0,"tot":0},"igstbal":{"intr":0,"oth":0,"tx":0,"fee":0,"pen":0,"tot":0},"sgstbal":{"intr":0,"oth":0,"tx":0,"fee":0,"pen":0,"tot":0},"cessbal":{"intr":0,"oth":0,"tx":0,"fee":0,"pen":0,"tot":0},"cgst":{"intr":0,"oth":0,"tx":0,"fee":0,"pen":0,"tot":0},"cess":{"intr":0,"oth":0,"tx":0,"fee":0,"pen":0,"tot":0},"tot_tr_amt":0,"tot_rng_bal":0,"cgstbal":{"intr":0,"oth":0,"tx":0,"fee":0,"pen":0,"tot":0},"igst":{"intr":0,"oth":0,"tx":0,"fee":0,"pen":0,"tot":0},"desc":"Closing Balance"}]}';
    let counter = 1;
    $("#dataTable").DataTable({
        data : data,
        "columns" : [
            {"data" : function () {
                    return counter++;
                }},
            {"data" : function (data) {
                    return getValue(data, "dpt_dt");
                }},
            {"data" : function (data) {
                    return getValue(data, "dpt_time");
                }},
            {"data" : function (data) {
                    return getValue(data, "rpt_dt");
                }},
            {"data" : function (data) {
                    return getValue(data, "ref_no");
                }},
            {"data" : function (data) {
                    return getValue(data, "ret_period");
                }},
            {"data" : function (data) {
                    return getValue(data, "desc");
                }},
            {"data" : function (data) {
                    return getValue(data, "tr_typ");
                }},
            {"data" : function (data) {
                    return checkNested(data, "igst", "tot") ? data.igst.tot : "-";
                }},
            {"data" : function (data) {
                    return checkNested(data, "cgst", "tot") ? data.cgst.tot : "-";
                }},
            {"data" : function (data) {
                    return checkNested(data, "sgst", "tot") ? data.sgst.tot : "-";
                }},
            {"data" : function (data) {
                    return checkNested(data, "cess", "tot") ? data.cess.tot : "-";
                }},
            {"data" : function (data) {
                    return getValue(data, "tot_tr_amt");
                }},
            {"data" : function (data) {
                    return checkNested(data, "igstbal", "tot") ? data.igstbal.tot : "-";
                }},
            {"data" : function (data) {
                    return checkNested(data, "cgstbal", "tot") ? data.cgstbal.tot : "-";
                }},
            {"data" : function (data) {
                    return checkNested(data, "sgstbal", "tot") ? data.sgstbal.tot : "-";
                }},
            {"data" : function (data) {
                    return checkNested(data, "cessbal", "tot") ? data.cessbal.tot : "-";
                }},
            {"data" : function (data) {
                    return getValue(data, "tot_rng_bal");
                }}
        ]
    })
}