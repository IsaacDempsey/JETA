/*********************************************************************************/

// [NOTE :] When "**" appears please refer documentation for more information

// This Script is the core script responsible to render the major functionilities in the UI.
// All the data is accessed by a API

/*********************************************************************************/

// LOCAL ADDRESS TO BE DYNAMIC
var localAddress = window.location.protocol; // Local url
var $j = jQuery.noConflict(); // No conflict with the major jquery for autocomplete widget

// The purpose of the global variables in this document is the ease of flow of data across every function wherever
// they might seem useful to use
var __startStop = ""; // Global Variable for Start Stop selected by the user on the form
var __endStop = ""; // End Stop selected by the user on the form
var __oldStartStop = ""; // Old start stop to make the undo feature
var __oldEndStop = ""; // Old End Stop to make the undo feature
var autocomplete_data = []; // This a global variable for the data that will be used to select for the destination field in the form
var startStopAutocompleteData; // A separate variable after the destination is entered by the user in order to plot markers
var current_flag = false; // This flag is set when the user allows to use the current location
// Autocomplete Feature when the user enters in the source address

// Window resize add and remove classes and show hide toggle buttons
function resizeWindow() {
  if ($(window).width() <= 650) {
    $("#toggle-button").show();
    $("#navbarToggleExternalContent").addClass("collapse");
    // $("#mobile-container").addClass("mobile-form-container");
    $j("#form").position({
      my: "right center",
      at: "right",
      of: ".mobile-form-container"
    });
  } else {
    $("#toggle-button").hide();
    $("#navbarToggleExternalContent").removeClass("collapse");
    // $("#mobile-container").removeClass("mobile-form-container");
    // $j("#form").position({
    //   my: "right center",
    //   at: "right",
    //   of: ".mobile-form-container"
    // });
  }
}

var old_left = "";
$(function() {
  $("#toggle-button").click(function() {
    if (old_left == "") {
      old_left = $j("#form").position().left;
    }
    var measure = $(window).width() - $j("#form").position().left;
    if ($("#navbarToggleExternalContent").hasClass("show")) {
      $j("#form").position({
        my: "center",
        at: "right",
        of: ".mobile-form-container"
      });
    } else {
      $j("#form").position({
        my: "center",
        at: "center",
        of: ".mobile-form-container"
      });
    }
  });
});
// On Document Ready
$(document).ready(function() {
  // When the document loads
  // Window resize add and remove classes and show hide toggle buttons

  resizeWindow();
  $(window).resize(function() {
    resizeWindow();
  });
  // Autoload the date for the user with the current date
  let today = moment().format("YYYY-MM-DD");
  document.querySelector("#date").value = today;
  // Set todays date on date picker as the minimum date
  document.getElementsByName("setTodaysDate")[0].setAttribute("min", today);
  // Autofill hour and mins with current time
  var today_time = moment().format("YYYY-MM-DDTHH:mm");
  var hour_slice = today_time.slice(11, 13);
  var mins_slice = today_time.slice(14, 16);
  var new_hour = document.getElementById("hour");
  var new_option1 = document.createElement("option");
  new_option1.value = hour_slice;
  new_hour.add(new_option1);
  var new_mins = document.getElementById("mins");
  var new_option2 = document.createElement("option");
  new_option2.text = mins_slice;
  new_option2.value = mins_slice;
  new_mins.add(new_option2);
  document.getElementById("hour").value = hour_slice;
  document.getElementById("mins").value = mins_slice;
  // Hide the various elements which will only be visible as and when required
  // Line holder holds the bus numbers which only be displayed when the user has entered the start and dest stops
  $("#lineholder").hide();
  // Journey Holder holds all the journey detail, ETA, Travel time etc. Only displayed when a bus is selected
  $("#journeyholder").hide();
  // No Source is that warning which tells the user that they cannot proceed to get the list of journey times
  // untill the source is provided
  $("#noSource").hide();
  // No Destination is same as No Source only for destination
  $("#noDestination").hide();
  // Error Tab or 404 tab that will be displayed when there is any major server side fault **
  $("#error").hide();
  // Error Sent tab that is shown when the user selects to send the error report **
  $("#errorsent").hide();
  // Over layer of the entire app when an error occurs **
  $(".overlay").hide();
  $j("#loadingtext").hide();
  $("#undo").addClass("disabled");
  // Once everything is hidden load the map
  // loadMap();
  $("#timetable-holder").hide();
  $j("#form").show("slide", { direction: "right" }, "fast");

  // After the map is loaded plot all the stops
  // loadAllStops();
  //close marker window on phone
  $(".close").click(function() {
    $j(".mobile-markerwindow").hide("slide", { direction: "down" }, "fast");
  });
  // Listening to changes of values on date and time
  $("#hour").change(function() {
      if ($("#hour").val() > hour_slice) {
        $("#ETA").hide();
        $("#next-bus").hide();
      } else {
        $("#ETA").show();
        $("#next-bus").show();
      }
    
  });
  $("#date").change(function() {
    // alert(today);
    if($("#date").val()>today){
        $("#ETA").hide();
        $("#next-bus").hide();
    } else{
        $("#ETA").show();
        $("#next-bus").show();
    }
  });
  $("#mins").change(function() {
      if ($("#mins").val() > mins_slice) {
          $("#ETA").hide();
          $("#next-bus").hide();
      } else {
          $("#ETA").show();
          $("#next-bus").show();
      }
  });
});

// Autocomplete feature for the UI Source inputs
$j(function () {
    
        // Check for the HTML DOM element who has #source as the id
    $j("#source").autocomplete({
        // Send a ajax request to the below address
        source: localAddress + '/main/get_address',
        // Start autocompleting when the user enter's atleast 2 characters
        minLength: 1,
        autoFocus: true,
        classes: {
            "ui-autocomplete": "highlight"
        },
        contentType: "application/json;charset=utf-8",
        dataType: "json",
        // When the user selects the required input ...-->
        select: function (e, ui) {
            deleteRoute();
            current_flag = false;
            if (__oldStartStop != "") {
                $("#undo").removeClass("disabled");
            }
            $("#pac-input").val("");
            // Get the stop id for the start
            $("#noSource").hide();
            var start = ui.item.label;
            var stopId = start.split(",");
            var startStop = stopId[stopId.length - 1]; 
            if (__oldStartStop == "") {
                __oldStartStop = startStop;
            }
            $("#destination").val("");
            $("#setDest").removeClass("disabled");
            // ..--> Send an ajax query to the api at the below URL
            getStops(startStop.trim());
        }
    });      
});
function getswitch(selected_dest){
    var source_val = $("#source").val();
    if (source_val != ""){
        $.ajax({
            url: localAddress + "/main/get_switch",
            // Set the start text as the label value
            data: {
                source: __startStop,
                destination: selected_dest,
            },
            contentType: "application/json;charset=utf-8",
            dataType: "json",
            error: function (jqXHR, textStatus, errorThrown) {
                $("#form").hide();
                $(".overlay").show();
                $(".loadingcontent").hide();
                $(".switch_note_content").hide();
                $j("#error").show("slide", { direction: "down" }, "fast");
                $("#errorcontent").html('<div class="col-xs-12 px-3 pt-3 mp-5 mobile-col-centered text-center display-4"> :( Oops !</div>' + '<div class="col-xs-12 p-3 display-5"> Error Occurred</div>' + '<div class="col-xs-12 p-3 mp-5">The server responded with: <b>' + jqXHR.status + " Status Code</b></div>" + '<div class="col-xs-12 p-3 mp-5">Error Reason: <b>' + jqXHR.statusText + " </b></div>" + '<div class="col-xs-12 p-3 mp-5 mobile-col-centered"><button type="button" class="btn btn-danger form-control inputRow px-3 mp-5" id="sendErrorReport" onclick=sendErrorReport()>Send Error Report Now !</button></div>');
            },
            // On success send this data to the receive data function
            success: function (data) {
                new_source = data.toString();
                data_str = data.toString();
                // Tell the user we are switching their source stop
                if (data != __startStop) {
                    var newSource_address = $("#source").val();
                    var pieces = newSource_address.split(',');
                    pieces.splice(-1, 1);
                    document.getElementById('SwitchText').innerHTML = "Your bus will leave from bus stop number: " + data;
                    $("#form").hide();
                    $(".overlay").show();
                    $(".loadingcontent").hide();
                    $(".errorreport").hide();
                }
                // Change the source
                __oldStartStop = __startStop
                var source_new_value = pieces.toString() + ', ' + new_source;
                $("#source").val(source_new_value);
                __startStop = new_source;
            }
        });
    } else {
        alert('Please set source first');
    }
}
function closeSwitchNote() {
  $(".overlay").hide();
  $("#form").show();
}

function getStops(startstop) {
  __startStop = startstop;
  $.ajax({
    url: localAddress + "/main/stops",
    // Set the start text as the label value
    data: { source: __startStop },
    contentType: "application/json;charset=utf-8",
    dataType: "json",
    error: function(jqXHR, textStatus, errorThrown) {
      $("#form").hide();
      $(".overlay").show();
      $(".loadingcontent").hide();
      $(".switch_note_content").hide();
      $j("#error").show("slide", { direction: "down" }, "fast");
      $("#errorcontent").html(
        '<div class="col-xs-12 px-3 pt-3 mp-5 mobile-col-centered text-center display-4"> :( Oops !</div>' +
          '<div class="col-xs-12 p-3 display-5"> Error Occurred</div>' +
          '<div class="col-xs-12 p-3 mp-5">The server responded with: <b>' +
          jqXHR.status +
          " Status Code</b></div>" +
          '<div class="col-xs-12 p-3 mp-5">Error Reason: <b>' +
          jqXHR.responseJSON.error +
          " </b></div>" +
          '<div class="col-xs-12 p-3 mp-5 mobile-col-centered"><button type="button" class="btn btn-danger form-control inputRow px-3 mp-5" id="sendErrorReport" onclick=sendErrorReport()>Send Error Report Now !</button></div>'
      );
    },
    // On success send this data to the receive data function
    success: function(data) {
      startStopAutocompleteData = data;
      // Create a json input for destinations only to select data from the returned filter
      autocomplete_data = [];
      for (var i = 0; i < data.length; i++) {
        if (data[i].stop_id == __startStop) {
          continue;
        } else {
          autocomplete_data.push({
            label: data[i].stop_name + ", " + data[i].stop_id
          });
        }
      }
      if (autocomplete_data == []) {
        autocomplete_data.push({
          label: "No Destination for this source found"
        });
      } else {
        $("#destination")
          .attr("placeholder", "Enter Destination")
          .css("background-color", "#ffffff");
        $("#destination").prop("disabled", false);
      }
      if ($("#destination") != "") {
        __oldEndStop = $("#destination").val();
      }
      addMarkers(data, __startStop);
      // This function loads all the stops either searched in the generic search bar or from current location
      function loadGenericStops(latitude, longitude, rad) {
        $.ajax({
          url: localAddress + "/main/locations",
          data: {
            lat: latitude,
            lng: longitude,
            radius: rad
          },
          contentType: "application/json;charset=utf-8",
          dataType: "json",
          error: function(jqXHR, textStatus, errorThrown) {
            $("#form").hide();
            $(".overlay").show();
            $(".loadingcontent").hide();
            $(".switch_note_content").hide();
            $j("#error").show("slide", { direction: "down" }, "fast");
            $("#errorcontent").html(
              '<div class="col-xs-12 px-3 pt-3 mp-5 mobile-col-centered text-center display-4"> :( Oops !</div>' +
                '<div class="col-xs-12 p-3 display-5"> Error Occurred</div>' +
                '<div class="col-xs-12 p-3 mp-5">The server responded with: <b>' +
                jqXHR.status +
                " Status Code</b></div>" +
                '<div class="col-xs-12 p-3 mp-5">Error Reason: <b>' +
                jqXHR.responseJSON.error +
                " </b></div>" +
                '<div class="col-xs-12 p-3 mp-5 mobile-col-centered"><button type="button" class="btn btn-danger form-control inputRow px-3 mp-5" id="sendErrorReport" onclick=sendErrorReport()>Send Error Report Now !</button></div>'
            );
          },
          success: function(data) {
            addMarkers(data);
            $("#setDest").addClass("disabled");
          }
        });
      }
      // refresh autocomplete for destination
      $j("#destination").autocomplete({
        source: autocomplete_data,
        minLength: 1,
        select: function(e, ui) {
          deleteRoute();

          // alert("Selecting Destination");
          $("#noDestination").hide();
          var end = ui.item.label;
          var stopId = end.split(",");
          var endStop = stopId[stopId.length - 1];
          __endStop = endStop.trim();
          getswitch(__endStop);
          addMarkers(startStopAutocompleteData, __startStop, __endStop);
        }
      });
    }
  });
}

// JQuery function to execute when the user clicks Get Travel Time Button
$(function onGetTravelTime() {
  $("#getTime").click(function() {
    if (__startStop == "" && __endStop == "") {
      $("#noSource").show();
      $("#sourceDiv").addClass("has-error has-feedback");
      $("#noDestination").show();
    } else if (__startStop == "") {
      $("#noDestination").hide();
      $("#noSource").show();
    } else if (__endStop == "") {
      $("#noSource").hide();
      $("#noDestination").show();
    } else {
      $("#noSource").hide();
      $("#noDestination").hide();
      // $("#home").animate({right:'-250px'});
      $j("#home").hide("slide", { direction: "left" }, "fast", function() {
        $j("#home1").show("slide", { direction: "right" }, "fast");
      });
      //
      getLines(__startStop, __endStop);
    }
  });
});

$(function onSearchAgain() {
  // If go back to search button is clicked
  $("#goBackSearch").click(function() {
    $("#journeyholder").hide();
    $j("#home1").hide("slide", { direction: "left" }, "fast", function() {
      $j("#home").show("slide", { direction: "right" }, "fast");
    });
  });
});

function setValueOnForm(address, stopid, flag) {
  $("#homeTab").addClass("active show");
  $("#ttTab").removeClass("active show");
  $("#homeMain").addClass("active show");
  $("#timetable").removeClass("active show");
  $("#setDest").removeClass("disabled");
  deleteRoute();
  $("#pac-input").val("");
  current_flag = false;
  if (flag == "source") {
    if ($(window).width() < 650) {
      $j(".mobile-markerwindow").hide("slide", { direction: "down" }, "fast");
    }
    // If the source button is clicked set the new source value as the concat of the address and the stopid
    var source_new_value = address + ", " + stopid;
    if ($("#source").val() != "") {
      $("#undo").removeClass("disabled");
      __oldStartStop = $("#source").val();
    }
    if ($("#destination").val() != "") {
      __oldEndStop = $("#destination").val();
    }

    $("#source").val(source_new_value);

    $("#destination").val("");
    __endStop == "";
    getStops(stopid); // Get the data and the markers now with this stop as the source
  } else {
    if ($(window).width() < 650) {
      $j(".mobile-markerwindow").hide("slide", { direction: "down" }, "fast");
      $("#toggle-button").click();
    }
    var source_val = $("#source").val();
    if (source_val != "") {
      var destination_new_value = address + ", " + stopid;
      if ($("#source").val() != "") {
        __oldStartStop = $("#source").val();
      }
      if ($("#destination").val() != "") {
        __oldEndStop = $("#destination").val();
      }
      $("#destination").val(destination_new_value);
      addMarkers(startStopAutocompleteData, __startStop, stopid);
    }
  }
  var visibility = $("#home").is(":visible");
  if (visibility == false) {
    $("#goBackSearch").click();
  }
}

$(function() {
  $("#undo").click(function() {
    deleteRoute();
    if (__oldStartStop == "") {
      return;
    } else {
      var newStop = __oldStartStop;
      __oldStartStop = $("#source").val();
      $("#source").val(newStop);
      var stopId = newStop.split(",");
      var startStop = stopId[stopId.length - 1];
      getStops(startStop.trim());
    }
  });
});
/* ----------------------------------------------------------------------- */
/*************************** MANIPULATION OF MARKERS ***********************/
/* ----------------------------------------------------------------------- */
function getLines(startStop, endStop){
    __startStop = startStop;
    __endStop = endStop;
    $.ajax({
      url: localAddress + "/main/lines",
      data: {
        source: startStop,
        destination: endStop,
      },
        error: function (jqXHR, textStatus, errorThrown) {
            $("#form").hide();
            $(".overlay").show();
            $(".loadingcontent").hide();
            $(".switch_note_content").hide();
            $j("#error").show("slide", { direction: "down" }, "fast");
            $("#errorcontent").html('<div class="col-xs-12 px-3 pt-3 mp-5 mobile-col-centered text-center display-4"> :( Oops !</div>' + '<div class="col-xs-12 p-3 display-5"> Error Occurred</div>' + '<div class="col-xs-12 p-3 mp-5">The server responded with: <b>' + jqXHR.status + " Status Code</b></div>" + '<div class="col-xs-12 p-3 mp-5">Error Reason: <b>' + jqXHR.statusText + " </b></div>" + '<div class="col-xs-12 p-3 mp-5 mobile-col-centered"><button type="button" class="btn btn-danger form-control inputRow px-3 mp-5" id="sendErrorReport" onclick=sendErrorReport()>Send Error Report Now !</button></div>');
        },
      contentType: "application/json;charset=utf-8",
      dataType: "json",
      success: function (data) {
          $("#lineholder").show();
          $("#line-pills").html('');
            var url1 = 'https://data.smartdublin.ie/cgi-bin/rtpi/realtimebusinformation?stopid=';
            var url2 = __startStop
            var url3 = '&format=json';
            var res = url1.concat(url2, url3);
            // If more than one bus route, sort by arriving first
            if (data.length > 1) {
            $.getJSON(res, function(bus) {
            var nextbus = [];
            for (var i = 0; i < bus.results.length; i++) {
                var iarr = bus.results[i];
                    nextbus.push(bus.results[i].route);           
            }            
                function intersect(nextbus, theroutes) {
                    return nextbus.filter(Set.prototype.has, new Set(theroutes));
                    }
                intersect_arr = intersect(nextbus, data);
                
                function removeDuplicates(long_arr){
                    short_arr = Array.from(new Set(long_arr))
                    return short_arr
                    }
                sorted_lines = removeDuplicates(intersect_arr)
            for (var i = 0; i < sorted_lines.length; i ++){
                $('<li class="nav-item"><a class="nav-link active" href="#" id="lineid" onclick=getTravelTime(this.innerHTML)>' + sorted_lines[i] + "</a></li>").appendTo("#line-pills");
            }
            });
            }
        else {
            for (var i = 0; i < data.length; i ++){
                $('<li class="nav-item"><a class="nav-link active" href="#" id="lineid" onclick=getTravelTime(this.innerHTML)>' + data[i] + "</a></li>").appendTo("#line-pills");
            }
        }
      }
  });
}
var old_nextbus = 0;
var count;
var rtpi_interval;
function getTravelTime(content) {
  clearInterval(rtpi_interval);

  var nextbustime;
  count = 0;
  deleteRoute();
  $("#journeyholder").show();

  var hour1 = document.getElementById("hour");
  var hour = hour1[hour1.selectedIndex].value;
  var mins1 = document.getElementById("mins");
  var mins = mins1[mins1.selectedIndex].value;
  var datetime_future_str = $("#date")
    .val()
    .concat("T", hour, mins);
  var datetime =
    moment(datetime_future_str, "YYYY-MM-DDTHH:mm").valueOf() / 1000;

  // var datetime = (moment($("#datetime").val(), "YYYY-MM-DDTHH:mm").valueOf())/1000;
  var rain = "0.5";
  var proxy = "https://cors-anywhere.herokuapp.com/";
  var darksky =
    "https://api.darksky.net/forecast/49d7bd97c9c756cb539c7bf0befee061/53.3551,-6.2493";
  var weather_url = proxy.concat(darksky);
  $.getJSON(weather_url, function(weather) {
    var current_time = Math.round(new Date().getTime() / 1000);
    // if time with hour of current time, use current rainfall
    if (datetime <= current_time + 3600 && datetime >= current_time - 3600) {
      rain = weather.currently.precipIntensity;
    } else {
      for (var i = 0; i < weather.hourly.data.length; i++) {
        var iarr = weather.hourly.data[i];
        if (datetime <= iarr.time + 3600 && datetime >= iarr.time - 3600) {
          rain = iarr.precipIntensity;
        }
      }
    }
  });
  var lin = content;
  startStopAutocompleteData.sort(function(a, b) {
    return Number(a.lineid[lin]) - Number(b.lineid[lin]);
  });
  getRoute(lin);
  $.ajax({
    url: localAddress + "/main/journeytime",
    data: {
      source: __startStop,
      destination: __endStop,
      lineid: lin,
      time: datetime,
      rain: rain
    },
    contentType: "application/json;charset=utf-8",
    dataType: "json",
    error: function(jqXHR, textStatus, errorThrown) {
      $("#form").hide();
      $(".overlay").show();
      $(".loadingcontent").hide();
      $(".switch_note_content").hide();
      $j("#error").show("slide", { direction: "down" }, "fast");
      $("#errorcontent").html(
        '<div class="col-xs-12 px-3 pt-3 mp-5 mobile-col-centered text-center display-4"> :( Oops !</div>' +
          '<div class="col-xs-12 p-3 display-5"> Error Occurred</div>' +
          '<div class="col-xs-12 p-3 mp-5">The server responded with: <b>' +
          jqXHR.status +
          " Status Code</b></div>" +
          '<div class="col-xs-12 p-3 mp-5">Error Reason: <b>' +
          jqXHR.statusText +
          " </b></div>" +
          '<div class="col-xs-12 p-3 mp-5 mobile-col-centered"><button type="button" class="btn btn-danger form-control inputRow px-3 mp-5" id="sendErrorReport" onclick=sendErrorReport()>Send Error Report Now !</button></div>'
      );
    },
    success: function(data) {
      var nextbus;
      var new_nextbus;
      var totaltraveltime = data.totaltraveltime;
      totaltraveltime = totaltraveltime.split(":");
      var currentTime = moment().format("HH:mm");
      var arrivaltime;
      var journeytime;
      var journeytime_toDisplay;
      console.log(totaltraveltime);
      if (Number(totaltraveltime[0]) > 0) {
        if (Number(totaltraveltime[2]) > 30) {
          journeytime =
            Number(totaltraveltime[0]) + (Number(totaltraveltime[1]) + 1);
          journeytime_toDisplay =
            totaltraveltime[0] +
            " hour " +
            (Number(totaltraveltime[1]) + 1).toString() +
            " mins";
        } else {
          journeytime = Number(totaltraveltime[0]) + Number(totaltraveltime[1]);
          journeytime_toDisplay =
            totaltraveltime[0] + " hour " + totaltraveltime[1] + " mins";
        }
      } else {
        if (Number(totaltraveltime[2]) > 30) {
          journeytime = Number(totaltraveltime[1]) + 1;
          journeytime_toDisplay =
            (Number(totaltraveltime[1]) + 1).toString() + " mins";
        } else {
          journeytime = Number(totaltraveltime[1]);
          journeytime_toDisplay = totaltraveltime[1] + " mins";
        }
      }

      console.log(journeytime);
      $("#journeyholder").show();
      $("#journeycontent").show();
      var url1 =
        "https://data.smartdublin.ie/cgi-bin/rtpi/realtimebusinformation?stopid=";
      var url3 = "&format=json";
      var live_db = url1.concat(__startStop, url3);
      $("#route-id").text(lin);
      $(journeytime + " mins").appendTo("#totaltraveltime-id");
      $("#totaltraveltime-id").text(journeytime_toDisplay);
      var length = getRTPI(lin);
      function getRTPI() {
        $.getJSON(live_db, function(bus) {
          var nextbuses = [];
          for (var i = 0; i < bus.results.length; i++) {
            var iarr = bus.results[i];
            if (iarr.route == lin) {
              nextbuses.push(bus.results[i].duetime);
            }
          }
          setTime(nextbuses);
        });
      }
      rtpi_interval = setInterval(getRTPI, 5000);

      function setTime(nextbuses) {
        count++;
        if (nextbuses.length == 0) {
          arrivaltime = "--:--";
          nextbustime = "No Information";
          clearInterval(rtpi_interval);
          line = lin;
        } else {
          var rtpiArrivalTime = nextbuses[0];

          if (rtpiArrivalTime == "Due") {
            if (count == 1) {
              arrivaltime = addMinutes(currentTime, journeytime);
            }
            nextbustime = rtpiArrivalTime;
            count = 0;
          } else {
            nextbus = Math.min(...nextbuses);
            if (count == 1) {
              arrivaltime = addMinutes(currentTime, journeytime);
              arrivaltime = addMinutes(arrivaltime, nextbus);
            }
            if (nextbus == 1) {
              nextbustime = String(nextbus) + " min";
            } else {
              nextbustime = String(nextbus) + " mins";
            }
          }
        }

        $("#eta-id").text(arrivaltime);
        $("#nextbus-id").text(nextbustime);
        return nextbustime;
      }

      function addMinutes(time, minsToAdd) {
        function D(J) {
          return (J < 10 ? "0" : "") + J;
        }
        var piece = time.split(":");
        var mins = piece[0] * 60 + +piece[1] + +minsToAdd;

        return D(((mins % (24 * 60)) / 60) | 0) + ":" + D(mins % 60);
      }
    }
  });
}
var route = "";
function getRoute(line) {
  $.ajax({
    url: localAddress + "/main/stops",
    // Set the start text as the label value
    data: {
      source: __startStop,
      destination: __endStop,
      lineid: line
    },
    contentType: "application/json;charset=utf-8",
    dataType: "json",
    error: function(jqXHR, textStatus, errorThrown) {
      $("#form").hide();
      $(".overlay").show();
      $(".loadingcontent").hide();
      $j("#error").show("slide", { direction: "down" }, "fast");
      $("#errorcontent").html(
        '<div class="col-xs-12 px-3 pt-3 mp-5 mobile-col-centered text-center display-4"> :( Oops !</div>' +
          '<div class="col-xs-12 p-3 display-5"> Error Occurred</div>' +
          '<div class="col-xs-12 p-3 mp-5">The server responded with: <b>' +
          jqXHR.status +
          " Status Code</b></div>" +
          '<div class="col-xs-12 p-3 mp-5">Error Reason: <b>' +
          jqXHR.responseJSON.error +
          " </b></div>" +
          '<div class="col-xs-12 p-3 mp-5 mobile-col-centered"><button type="button" class="btn btn-danger form-control inputRow px-3 mp-5" id="sendErrorReport" onclick=sendErrorReport()>Send Error Report Now !</button></div>'
      );
    },
    // On success send this data to the receive data function
    success: function(data) {
      var coordinates = [];
      data.sort(function(a, b) {
        return Number(a.lineid[line]) - Number(b.lineid[line]);
      });
      for (var i = 0; i < data.length; i++) {
        coordinates.push({
          lat: data[i].coord[1],
          lng: data[i].coord[0]
        });
      }
      route = new google.maps.Polyline({
        path: coordinates,
        geodesic: true,
        strokeColor: "yellow",
        strokeOpacity: 1.0,
        strokeWeight: 8
      });

      deleteRoute();
      route.setMap(map);
      addMarkers(data, __startStop, __endStop);
      setMapBounds(__startStop);
    }
  });
}
