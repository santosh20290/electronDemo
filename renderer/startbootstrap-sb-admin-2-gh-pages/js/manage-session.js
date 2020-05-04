var path  = $("#contextPath").val();
if(sessionStorage.userData == null || sessionStorage.userData == undefined || sessionStorage.userData == "null" || sessionStorage.userData == "undefined") {
    window.location = path;
}

let usrFirstName = getSessionDataByKey("userData","usrFirstName");
let usrLastName = getSessionDataByKey("userData","usrLastName");
let fullName = usrFirstName + " " + usrLastName;
$(".userName").text(checkAndTrimString(fullName,25, 25));
$(".userName").attr("title", fullName);
$(".joiningdate").text("Member since "+getSessionDataByKey("userData","usrcreatedDate"));