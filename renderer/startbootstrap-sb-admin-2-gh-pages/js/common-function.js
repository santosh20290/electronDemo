function isEmpty(val) {
    return val == null || val == undefined || val == "" || val == "undefined" || val == "null";
}

function checkNested(obj) {
    var args = Array.prototype.slice.call(arguments, 1);

    for (var i = 0; i < args.length; i++) {
        if (!obj || !obj.hasOwnProperty(args[i])) {
            return false;
        }
        obj = obj[args[i]];
    }
    return true;
}

function doAjaxCall(doAjax_params, successCallback) {
    var url = doAjax_params['url'];
    var requestType = doAjax_params['requestType'];
    var dataType = (typeof (doAjax_params['dataType']) != "undefined") ? doAjax_params['dataType'] : 'json';

    var data = doAjax_params['data'];
    var action = doAjax_params['action'];
    var gstinId = "";

    if (sessionStorage.selectedPracticeOrBusiness) {
        gstinId = sessionStorage.selectedPracticeOrBusiness;
    }

    var defaultHeaders = {
        'Accept' : 'application/json',
        'sessionToken' : getSessionDataByKey("userData", "usrSessionToken"),
        'usrId' : getSessionDataByKey("userData", "usrId"),
        'gstin' : sessionStorage.SELECTEDGSTIN,
        'gstinId' : gstinId,
        'returnPeriod' : sessionStorage.taxPeriodNumber,
        'returnType' : sessionStorage.returnType,
        'txnId' : sessionStorage.txnId,
        'action' : action
    };

    var isMultipart = doAjax_params['isMultipart'];
    if (doAjax_params['async_type']) {
        var async_type = false;
    } else {
        var async_type = true;
    }

    if (isMultipart) {
        var isFirstDataUpload = doAjax_params["initialUploadFlag"];
        var isReconRefresh = doAjax_params["isRefresh"];
        if ((typeof isFirstDataUpload != 'undefined')) {
            defaultHeaders["initialUploadFlag"] = isFirstDataUpload;
        }
        if ((typeof isReconRefresh != 'undefined')) {
            defaultHeaders["isRefresh"] = isReconRefresh;
            defaultHeaders["reconTxnId"] = sessionStorage.reconTxnId;
        }

        let isJson = doAjax_params["isJson"];

        if ((typeof isJson != 'undefined')) {
            defaultHeaders["isJson"] = isJson;
        }

        $.ajax({
            url : url,
            type : requestType,
            headers : defaultHeaders,
            data : data,
            enctype : 'multipart/form-data',
            crossDomain : true,
            processData : false,
            contentType : false,
            cache : false,
            success : function(res, status, xhr) {
                //code to enable button
                $("#" + sessionStorage.buttonDisabled).attr("disabled", false);
                successCallback(res, status, xhr);
            }
        });
    } else {
        defaultHeaders["Content-Type"] = 'application/json;charset=UTF-8';
        $.ajax({
            url : url,
            headers : defaultHeaders,
            type : requestType,
            dataType : dataType,
            data : JSON.stringify(data),
            crossDomain : true,
            async : async_type,
            cache : false,
            success : function(res, status, xhr) {
                //code to enable button
                $("#" + sessionStorage.buttonDisabled).attr("disabled", false);
                successCallback(res, status, xhr);
            }
        });
    }
}

function getSessionDataByKey(objName, key) {
    var sessionObj = getSessionData(objName);
    if ((((typeof sessionObj != 'undefined'))) && (((sessionObj != "")))) {
        if (typeof sessionObj[key] == 'undefined') {
            return "";
        } else {
            return sessionObj[key];
        }
    } else {
        return "";
    }
}

function getSessionData(objName) {
    if ((((typeof sessionStorage[objName] != 'undefined'))) && (((sessionStorage[objName] != '')))) {
        var objData = JSON.parse(sessionStorage[objName]);
        if (typeof objData == 'undefined') {
            return "";
        } else {
            return objData;
        }
    }
}

$(document).ajaxError(function myErrorHandler(event, xhr, ajaxOptions, thrownError) {
    notifyMessage('danger',  xhr.responseJSON.message);
});

function notifyMessage(type, message){
    $.notify(message, {
        animate: {
            enter: 'animated bounceIn',
            exit: 'animated bounceOut'
        },
        type: type
    });
}

/*
* Function To control the string length
*/
function checkAndTrimString(str, maxSize = 25, STRING_MAX_LENGTH = 30) {
    if (typeof str === "string") {
        if (str.trim().length > STRING_MAX_LENGTH) {
            str = str.substr(0, maxSize) + "...";
        }
    }
    return (str);
}

$("#signOut").click(
    function () {
        var doAjax_params_default = {
            'url': 'https://gsthero.com/GSPApplication/v1/users/logout/',
            'requestType': "POST",
            'headers': {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            'dataType': 'json',
            'data': {
                'usrId': getSessionDataByKey("userData", "usrId"),
                "sessionToken": getSessionDataByKey("userData", "usrSessionToken")
            },
            'action': 'LOGOUT'
        };

        doAjaxCall(doAjax_params_default, function (response) {
            sessionStorage.clear();
            ipcRenderer.send('logout-success');
        });
    });