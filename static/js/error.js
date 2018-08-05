


// -------------------------***********************--------------------------------------
// THIS FILE IS RESPONSIBLE FOR ALL THE CORE FUNCTIONALITIES-----------------------------
// e.g., Error display, styles etc
//--------------------------***********************--------------------------------------



// LOCAL ADDRESS TO BE DYNAMIC
var localAddress = window.location.protocol // Local url
var $j = jQuery.noConflict(); // No conflict with the major jquery for autocomplete widget



/////////////////////////////////////////////////////////////////////////////////////////
// This function is executed when user clicks on the button send error report
function sendErrorReport() {
    $j("#errorcontent").hide("slide", { direction: "right" }, "fast", function () {
        $j("#errorsent").show("slide", { direction: "right" }, "fast");
    });

}
////////////////////////////////////////////////////////////////////////////////////////


////////////////////////////////////////////////////////////////////////////////////////
// This function executes after the error display is closed for the user
// It simply hides all the error display shows up the form and reloads the page
$(function () {
    $("#closeError").click(function () {
        $("#error").hide();
        $(".overlay").hide();
        $("form").show();
        location.reload();
    });
});
////////////////////////////////////////////////////////////////////////////////////////
