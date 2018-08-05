// LOCAL ADDRESS TO BE DYNAMIC
var localAddress = window.location.protocol // Local url
var $j = jQuery.noConflict(); // No conflict with the major jquery for autocomplete widget



// ----------------------------------------------------------------------------------------------------------------------------
// ----------- The following section contains all the code used to retrieve and manipulate the timetable display on the UI --------
// ----------------------------------------------------------------------------------------------------------------
var __timeTableStop; // A global variable 
// Get the timetable values here
$j(function () {
    $j("#timetable-search").autocomplete({
        source: localAddress + "/main/get_address",
        minLength: 1,
        autoFocus: true,
        classes: {
            "ui-autocomplete": "highlight"
        },
        contentType: "application/json;charset=utf-8",
        dataType: "json",
        select: function (e, ui) {
            var start = ui.item.label;
            var pieces = start.split(",");
            var stopid = pieces[pieces.length - 1];
            __timeTableStop = stopid;
            getTimeTable(stopid);
        }
    });
});
function getTimeTable(stopid) {
    $.ajax({
        url: localAddress + "/main/get_timetable",
        data: {
            stopid: stopid,
        },
        contentType: "application/json;charset=utf-8",
        dataType: "json",
        error: function (jqXHR, textStatus, errorThrown) {
            $("#form").hide();
            $(".overlay").show();
            $(".loadingcontent").hide();
            $(".switch_note_content").hide();
            $j("#error").show("slide", { direction: "down" }, "fast");
            $("#errorcontent").html('<div class="col-xs-12 px-3 pt-3 mp-5 mobile-col-centered text-center display-4"> :( Oops !</div>' + '<div class="col-xs-12 p-3 display-5"> Error Occurred</div>' + '<div class="col-xs-12 p-3 mp-5">The server responded with: <b>' + jqXHR.status + " Status Code</b></div>" + '<div class="col-xs-12 p-3 mp-5">Error Reason: <b>' + jqXHR.responseJSON.error + " </b></div>" + '<div class="col-xs-12 p-3 mp-5 mobile-col-centered"><button type="button" class="btn btn-danger form-control inputRow px-3 mp-5" id="sendErrorReport" onclick=sendErrorReport()>Send Error Report Now !</button></div>');
        },
        success: function (data) {
            // Here we will receive all the lines as per their schedule data
            // Loop over the array
            $("#timetable-holder").show();
            $(".schedule").hide();
            var routes = [];
            for (var i = 0; i < data.length; i++) {
                routes.push(data[i].lineid);
            }
            var uniqueRoutes = [];
            $.each(routes, function (i, el) {
                if ($.inArray(el, uniqueRoutes) === -1) uniqueRoutes.push(el);
            });
            $("#timetable-content").html("");
            for (var i = 0; i < uniqueRoutes.length; i++) {
                var line_num = uniqueRoutes[i];
                var collapse_id = 'dayofservice' + line_num;
                $('<div class="col-sm-12 col-centered mobile-col-centered pt-1"><div class="row p-2" id="tt"><div class="col-sm-6" id="tt-line">' + line_num + '</div><div class="col-sm text-right" id="tt-caret"><a data-toggle="collapse" href="#' + collapse_id + '" role="button" aria-expanded="false" aria-controls="' + collapse_id + '" style="color: white" id="open-tt" onclick="getSchedule(\'' + line_num + '\')"><i class="fas fa-caret-down"></i></a></div></div><div class="collapse dayofservice" id="' + collapse_id + '"><div class="row p-2"><div class="col-sm">Weekdays</div><div class="col-sm text-right"><a class="show-tt" onclick="currentTimeTable(3)"><i class="fas fa-eye"></i></a></div></div><div class="row p-2"><div class="col-sm">Sunday </div><div class="col-sm text-right"><a class="show-tt" onclick="currentTimeTable(1)"> <i class="fas fa-eye"></i></a></div></div><div class="row p-2"><div class="col-sm">Saturday</div><div class="col-sm text-right"><a class="show-tt" onclick="currentTimeTable(2)"><i class="fas fa-eye"></i></a></div></div></div></div>').appendTo("#timetable-content");
                
            }
        }

    })
}

function getSchedule(line) {
    var stopid;
    if (__timeTableStop) {
        stopid = __timeTableStop;
    }
    $.ajax({
        url: localAddress + "/main/get_timetable",
        data: {
            stopid: stopid,
            line: line
        },
        contentType: "application/json;charset=utf-8",
        dataType: "json",
        error: function (jqXHR, textStatus, errorThrown) {
            //console.log(jqXHR);
            $("#form").hide();
            $(".overlay").show();
            $(".loadingcontent").hide();
            $(".switch_note_content").hide();
            $j("#error").show("slide", { direction: "down" }, "fast");
            $("#errorcontent").html('<div class="col-xs-12 px-3 pt-3 mp-5 mobile-col-centered text-center display-4"> :( Oops !</div>' + '<div class="col-xs-12 p-3 display-5"> Error Occurred</div>' + '<div class="col-xs-12 p-3 mp-5">The server responded with: <b>' + jqXHR.status + " Status Code</b></div>" + '<div class="col-xs-12 p-3 mp-5">Error Reason: <b>' + jqXHR.responseJSON.error + " </b></div>" + '<div class="col-xs-12 p-3 mp-5 mobile-col-centered"><button type="button" class="btn btn-danger form-control inputRow px-3 mp-5" id="sendErrorReport" onclick=sendErrorReport()>Send Error Report Now !</button></div>');
        },
        success: function (data) {
            console.log(data);
            var stopid = data[0].stopid;
            var lineid = data[0].lineid;
            $("#schedule-stop-number").html(stopid);
            $("#schedule-line-num").html(lineid);
            showScheduleTimes(data);
        }
    });
}
function showScheduleTimes(schedule_data) {
    // This function displays all time of the timetable
    // Here we will check the day of week and position the timers in their individial page
    var Saturday = false;
    var Sunday = false;
    var Weekday = false;
    console.log(schedule_data);
    
    
    $("#card-saturday").html("");
    $("#card-sunday").html("");
    $("#card-weekdays").html("");
    $.each(schedule_data, function (i, el) {
        var schedule_time = el.schedule;
        if (el.dayofservice == 'Saturday') {

            Saturday = true;
            var destination = el.destination;
            var heading = i.toString()
            var id_for_table = 'saturday' + heading;
            $('<div class="card-header" id="heading' + heading + '"><h5 class="mb-0"><button id="saturday-destination-name" class="btn btn-link" type="button" data-toggle="collapse" data-target="#collapseSaturday' + destination + '" aria-expanded="true" aria-controls="#collapseSaturday' + destination + '">Towards: ' + destination + '</button></h5></div><div id="collapseSaturday' + destination + '" class="collapse show" aria-labelledby="' + heading + '" data-parent="#accordionExample"><div class="card-body schedule-time-saturday" id="' + id_for_table + '"></div></div>').appendTo("#card-saturday");
            // Do something in Saturday DOM
            for (var i = 0; i < schedule_time.length; i = i + 4) {
                var scheduletime1 = schedule_time[i];
                var scheduletime2 = schedule_time[i + 1];
                var scheduletime3 = schedule_time[i + 2];
                var scheduletime4 = schedule_time[i + 3];
                if (typeof scheduletime1 == 'undefined') {
                    scheduletime1 = "";
                }
                if (typeof scheduletime2 == 'undefined') {
                    scheduletime2 = "";
                }
                if (typeof scheduletime3 == 'undefined') {
                    scheduletime3 = "";
                }
                if (typeof scheduletime4 == 'undefined') {
                    scheduletime4 = "";
                }
                $('<div class="row p-3 mp-5 schdule-rows"><div class="col-xs-3 col-sm-3">' + scheduletime1 + '</div><div class="col-xs-3 col-sm-3">' + scheduletime2 + '</div><div class="col-xs-3 col-sm-3">' + scheduletime3 + '</div><div class="col-xs-3 col-sm-3">' + scheduletime4 + "</div></div>").appendTo("#" + id_for_table);
            }
        }
        if (el.dayofservice == 'Sunday') {
            Sunday = true;
            var destination = el.destination;
            var heading = i.toString();
            var id_for_table = "sunday" + heading;
            $('<div class="card-header" id="heading' + heading + '"><h5 class="mb-0"><button id="sunday-destination-name" class="btn btn-link" type="button" data-toggle="collapse" data-target="#collapseSunday' + destination + '" aria-expanded="true" aria-controls="collapseSunday' + destination + '">Towards: ' + destination + '</button></h5></div><div id="collapseSunday' + destination + '" class="collapse show" aria-labelledby="heading' + heading + '" data-parent="#accordionExample"><div class="card-body schedule-time-sunday" id="' + id_for_table + '"></div></div>').appendTo("#card-sunday");
            // Do something in Saturday DOM
            for (var i = 0; i < schedule_time.length; i = i + 4) {
                var scheduletime1 = schedule_time[i];
                var scheduletime2 = schedule_time[i + 1];
                var scheduletime3 = schedule_time[i + 2];
                var scheduletime4 = schedule_time[i + 3];
                if (typeof scheduletime1 == 'undefined') {
                    scheduletime1 = "";
                }
                if (typeof scheduletime2 == 'undefined') {
                    scheduletime2 = "";
                }
                if (typeof scheduletime3 == 'undefined') {
                    scheduletime3 = "";
                }
                if (typeof scheduletime4 == 'undefined') {
                    scheduletime4 = "";
                }
                $('<div class="row p-3 mp-5 schdule-rows"><div class="col-xs-3 col-sm-3">' + scheduletime1 + '</div><div class="col-xs-3 col-sm-3">' + scheduletime2 + '</div><div class="col-xs-3 col-sm-3">' + scheduletime3 + '</div><div class="col-xs-3 col-sm-3">' + scheduletime4 + "</div></div>").appendTo("#" + id_for_table);
            }
        }
        if (el.dayofservice == "Weekday") {
            Weekday = true;
            var destination = el.destination;
            var heading = i.toString()
            var id_for_table = "weekdays" + heading;
            $('<div class="card-header" id="heading' + heading + '"><h5 class="mb-0"><button id="weekday-destination-name" class="btn btn-link" type="button" data-toggle="collapse" data-target="#collapseWeekday' + destination + '" aria-expanded="true" aria-controls="collapseWeekday' + destination + '">Towards: ' + destination + '</button></h5></div><div id="collapseWeekday' + destination + '" class="collapse show" aria-labelledby="' + heading + '" data-parent="#accordionExample"><div class="card-body schedule-time-weekdays" id="' + id_for_table+'"></div></div>').appendTo("#card-weekdays");
            // Do something in Saturday DOM
            for (var i = 0; i < schedule_time.length; i = i + 4) {
                var scheduletime1 = schedule_time[i];
                var scheduletime2 = schedule_time[i + 1];
                var scheduletime3 = schedule_time[i + 2];
                var scheduletime4 = schedule_time[i + 3];
                if (typeof scheduletime1 == 'undefined') {
                    scheduletime1 = "";
                }
                if (typeof scheduletime2 == 'undefined') {
                    scheduletime2 = "";
                }
                if (typeof scheduletime3 == 'undefined') {
                    scheduletime3 = "";
                }
                if (typeof scheduletime4 == 'undefined') {
                    scheduletime4 = "";
                }
                $('<div class="row p-3 mp-5 schdule-rows"><div class="col-xs-3 col-sm-3">' + scheduletime1 + '</div><div class="col-xs-3 col-sm-3">' + scheduletime2 + '</div><div class="col-xs-3 col-sm-3">' + scheduletime3 + '</div><div class="col-xs-3 col-sm-3">' + scheduletime4 + "</div></div>").appendTo("#" + id_for_table);
            }
        }
    });
    if (!Saturday) $("#card-saturday").html("No Service");
    if (!Sunday) $("#card-sunday").html("No Service");
    if (!Weekday) $("#card-weekdays").html("No Service");

}
function changeDestination(new_value_id) {
    var old_value = $("#schedule-line-destination").html();

    var new_value = document.getElementById(new_value_id).innerHTML;
    $("#schedule-line-destination").html(new_value);
    document.getElementById(new_value_id).innerHTML = old_value;
}
var dayIndex = 1;
function plusTimeTable(n) {
    openTimeTable(dayIndex += n);
}

function currentTimeTable(n) {
    openTimeTable(dayIndex = n);
}
var count = 0;
function openTimeTable(n) {
    count++;
    $(".schedule").fadeIn("fast");
    $j(".schedule").draggable();

    if (count == 1) {
        $('#schedule-container').css('position', 'absolute');
    }

    // $j("#schedule-container").position({
    //   my: "center",
    //   at: "center",
    //   of: ".wrapper"
    // });
    var days = document.getElementsByClassName("schedule-holder");
    if (n > days.length) { dayIndex = 1 };
    if (n < 1) { dayIndex = days.length };
    for (var i = 0; i < days.length; i++) {
        days[i].style.display = "none";
    }
    days[dayIndex - 1].style.display = "block";
}

$(function () {
    $("#close-tt").click(function () {
        $("#open-tt").click();
        $(".schedule").fadeOut("fast");
    })
})

function openScheduleforStop(stopname, stopid) {
    if ($(window).width() < 650) {
        $j(".mobile-markerwindow").hide("slide", { direction: "down" }, "fast");
        $("#toggle-button").click();
    }
    __timeTableStop = stopid;
    $("#timetable-content").html("");
    $("#homeTab").removeClass("active show");
    $("#ttTab").addClass("active show");
    $("#homeMain").removeClass('active show');
    $("#timetable").addClass('active show');
    getTimeTable(stopid);
    var stop_val = stopname + ' ,' + stopid.toString();
    $("#timetable-search").val(stop_val);
}