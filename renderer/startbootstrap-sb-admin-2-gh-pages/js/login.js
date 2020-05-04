// Modules
const {ipcRenderer, app, re} = require('electron')

$("#loginForm").validate(
    {
        rules : {
            email : {
                required : true,
            },
            password : {
                required : true,
            }
        },
        messages : {
            email : {
                required : "Enter GSTN Portal User name",
            },
            password : {
                required : "Enter GSTN Portal Password",
            }
        },
        submitHandler : function(form) {
            var doAjax_params_default1 = {
                'url' : 'https://gsthero.com/GSPApplication/v1/users/login',
                'requestType' : "POST",
                'headers' : {
                    'Accept' : 'application/json',
                    'Content-Type' : 'application/json'
                },
                'dataType' : 'json',
                'data' : {
                    "usrEmail" : $("#email").val(),
                    "usrPwd" : $("#password").val(),
                    "inviteUuid" : ""
                },
                'action' : 'LOGIN'
            };
            doAjaxCall(doAjax_params_default1, function(response,status,xhr) {
                console.log(response);
                if(response.status == "SUCCESS"){
                    storeUserSession(response.data);

                    ipcRenderer.send('login-success');
                }

            });

            // $.ajax({    //Send Request
            //     url: "https://randomuser.me/api/?results=1",
            //     datatype: "json",
            //     success: function (data) {
            //         console.log(data);
            //     }
            // });
            // let email = document.getElementById("email");
            // let password = document.getElementById("password");
            // loginHander(email, password);
        }
    });

function storeUserSession(data) {
    if (typeof (Storage) !== "undefined") {
        // Store user data in one obj of session storage
        var userData = {};
        userData = {
            usrId : data["usrId"],
            usrFirstName : data["usrFirstName"],
            usrLastName : data["usrLastName"],
            usrEmail : data["usrEmail"],
            usrSessionToken : data["usrSessionToken"],
            usrcreatedDate : data["createdDate"],
            usrType : data['signUpAs'],
            multiUserType : String(data['multiUserType']),
            uId : data["uuid"],
            loginTime : new Date(),
            broadCastingMessages : JSON.stringify(data["broadCastingMessages"]),
            unreadFeaturesCount : data['unreadFeaturesCount']
        };
        sessionStorage.usroperationList = data['operationList'];
        sessionStorage.userData = JSON.stringify(userData);
    } else {
        notifyMessage('danger', "Sorry, your browser does not support web storage...");
    }
}