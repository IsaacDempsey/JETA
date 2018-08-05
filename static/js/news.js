// This file loads the data on the news tab
$(function () {
    $.ajax({
        url: "http://www.dublinbus.ie/RSS/Rss-news/",
        type: 'GET',
        dataType: "xml",
        error: function(jqXHR, textStatus, errorThrown) {
            //console.log(jqXHR);
            $("#form").hide();
            $(".overlay").show();
            $(".loadingcontent").hide();
            $(".switch_note_content").hide();
            $j("#error").show("slide", { direction: "down" }, "fast");
            $("#errorcontent").html('<div class="col-xs-12 px-3 pt-3 mp-5 mobile-col-centered text-center display-4"> :( Oops !</div>' + '<div class="col-xs-12 p-3 display-5"> Error Occurred</div>' + '<div class="col-xs-12 p-3 mp-5">The server responded with: <b>' + jqXHR.status + " Status Code</b></div>" + '<div class="col-xs-12 p-3 mp-5">Error Reason: <b>' + jqXHR.statusText + " </b></div>" + '<div class="col-xs-12 p-3 mp-5 mobile-col-centered"><button type="button" class="btn btn-danger form-control inputRow px-3 mp-5" id="sendErrorReport" onclick=sendErrorReport()>Send Error Report Now !</button></div>');
        },
        success: function(xml) {
            $(xml).find('item').each(function () {
                var title = $(this).find("title").text();
                console.log(text);
                
            })
        }
    });  
})