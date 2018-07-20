
/*********************************************************************************/
  
 // [NOTE :] When "**" appears please refer documentation for more information


 // This Script renders all the UI animations and interactions for the user.
 // All the data is accessed by a API


/*********************************************************************************/

// LOCAL ADDRESS TO BE DYNAMIC
var localAddress = window.location.protocol // Local url
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


// On Document Ready
$(document).ready(function () {
    // When the document loads
    // Autoload the date and time for the user with the current time
    let today = moment().format("YYYY-MM-DDTHH:mm");
    document.querySelector("#datetime").value = today;
    // deactivate the destination field which will only be activated when the user enters a source
    deactivateDestination(autocomplete_data); 
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
    // Home 1 is the slider that slides in when the busses has to be displayed
    $("#home1").hide();
    // Error Tab or 404 tab that will be displayed when there is any major server side fault **
    $("#error").hide();
    // Error Sent tab that is shown when the user selects to send the error report **
    $("#errorsent").hide();
    // Over layer of the entire app when an error occurs **
    $(".overlay").hide();
    $j("#loadingtext").hide();
    $("#undo").addClass("disabled");
    // Once everything is hidden load the map
    loadMap();
    $j("#form").show("slide", { direction: "right" }, "slow");
    
    // After the map is loaded plot all the stops
    // loadAllStops();
});

// Separate Function to render the map
function loadMap() {
    // This functions sole purpose is to load the google map asynchronously and 
    // then provide a global variable of the map to be used everywhere
    $.getJSON('/static/json/map_style.json', function (mapstyle) {
        // Map variable holding the map from the above custom defined json style **
        var map = new google.maps.Map(document.getElementById("map"), {
            // center on Dublin
            center: new google.maps.LatLng(
                53.346834137467795,
                -6.254525456712543
            ),
            // Following options moves the Map Controls from right to left **
            // This is done because we have our form on the right
            mapTypeControl: false,
            mapTypeControlOptions: {
                style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
                position: google.maps.ControlPosition.TOP_CENTER
            },
            zoomControl: true,
            zoomControlOptions: {
                position: google.maps.ControlPosition.LEFT_CENTER
            },
            scaleControl: true,
            streetViewControl: true,
            streetViewControlOptions: {
                position: google.maps.ControlPosition.LEFT_TOP
            },
            fullscreenControl: false,
            zoom: 12,
            styles: mapstyle
        });

        // Auto complete of generic search to plot bus stops near a paricular location
        // Create the search box and link it to the UI element.
        var input = document.getElementById('pac-input');
        var searchform = document.getElementById('search-form');
        var searchBox = new google.maps.places.SearchBox(input);
        map.controls[google.maps.ControlPosition.TOP_LEFT].push(input);
        map.controls[google.maps.ControlPosition.TOP_LEFT].push(searchform);

        // Bias the SearchBox results towards current map's viewport.
        map.addListener('bounds_changed', function () {
            searchBox.setBounds(map.getBounds());
        });
        var radius = '1km';
        var lat = null;
        var lng = null;
        var places = [];
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(runCurrentStopLoader);
        } else {
            console.log( "Geolocation is not supported by this browser.");
        }
        $("input[type=radio][name=switch_3]").change(function () {
            radius = this.value;
            if (places.length != 0 || current_flag == true) {
              runGenericStopLoader(lat, lng, radius);
            }
            
        });
        searchBox.addListener('places_changed', function () {
            places = searchBox.getPlaces();
            if (places.length == 0) {
                is_places_entered = false;
            } else {
                is_places_entered = true;
                lat = places[0].geometry.location.lat();
                lng = places[0].geometry.location.lng();
                
                // console.log(places[0].geometry.location.lat());
                // console.log(places[0].geometry.location.lng());
                runGenericStopLoader(lat,lng,radius);
            }

        });
        function runCurrentStopLoader(position){
            current_flag = true;
            lat = position.coords.latitude;
            lng = position.coords.longitude;
            if (radius == "500m") {
              radius = 0.005;
            } else if (radius == "1km") {
              radius = 0.01;
            } else if (radius == "2km") {
              radius = 0.02;
            }
            loadGenericStops(lat, lng, radius);
        }
        function runGenericStopLoader(lat,lng,radius){
            if (radius == '500m') {
                radius = 0.005
            } else if (radius == '1km') {
                radius = 0.01
            } else if (radius == '2km') {
                radius = 0.02
            }
            loadGenericStops(lat, lng, radius);
        }

        // Finally set the map as a global map variable
        setGlobalMap(map);
    });
}

// Creating a Global Map Object
var map;
function setGlobalMap(Asyncmap) {
    // We need a new javascript function to set the map as a global variable because, the map is loaded asynchronously
    // using a json mapstyle, hence everythin will be executed before the map loads, this function will be called in the 
    // end of the load. Hence setting the map globally.
    map = Asyncmap;
}
// This function loads all the stops either searched in the generic search bar or from current location
function loadGenericStops(latitude, longitude,rad){
    $.ajax({
      url: localAddress + "/main/locations",
      data:{
          lat: latitude,
          lng: longitude,
          radius: rad
      },
      contentType: "application/json;charset=utf-8",
      dataType: "json",
      error: function(jqXHR, textStatus, errorThrown) {
        console.log(jqXHR);
        $("#form").hide();
        $(".overlay").show();
        $(".loadingcontent").hide();
        $j("#error").show("slide", { direction: "down" }, "fast");
          $("#errorcontent").html('<div class="col-xs-12 px-3 pt-3 mp-5 mobile-col-centered text-center display-4"> :( Oops !</div>' + '<div class="col-xs-12 p-3 display-5"> Error Occurred</div>' + '<div class="col-xs-12 p-3 mp-5">The server responded with: <b>' + jqXHR.status + " Status Code</b></div>" + '<div class="col-xs-12 p-3 mp-5">Error Reason: <b>' + jqXHR.responseJSON.error + " </b></div>" + '<div class="col-xs-12 p-3 mp-5 mobile-col-centered"><button type="button" class="btn btn-danger form-control inputRow px-3 mp-5" id="sendErrorReport" onclick=sendErrorReport()>Send Error Report Now !</button></div>');
      },
      success: function(data) {
        addMarkers(data);
      }
    });
}
function loadAllStops(){
    console.log("Loading all Stops");
    $(".overlay").show();
    $("#loading").show();
    $j("#loadingtext").show("slide", { direction: "right" }, "fast");
    $.ajax({
        url: localAddress + "/main/stops",
        contentType: "application/json;charset=utf-8",
        dataType: "json",
        error: function (jqXHR, textStatus, errorThrown) {
            $("#form").hide();
            $(".overlay").show();
            $(".loadingcontent").hide();
            $j("#error").show("slide", { direction: "down" }, "fast");
            $("#errorcontent").html('<div class="col-xs-12 px-3 pt-3 mp-5 mobile-col-centered text-center display-4"> :( Oops !</div>' + '<div class="col-xs-12 p-3 display-5"> Error Occurred</div>' + '<div class="col-xs-12 p-3 mp-5">The server responded with: <b>' + jqXHR.status + " Status Code</b></div>" + '<div class="col-xs-12 p-3 mp-5">Error Reason: <b>' + jqXHR.responseJSON.error + " </b></div>" + '<div class="col-xs-12 p-3 mp-5 mobile-col-centered"><button type="button" class="btn btn-danger form-control inputRow px-3 mp-5" id="sendErrorReport" onclick=sendErrorReport()>Send Error Report Now !</button></div>');
        },
        success: function (data) {
            addMarkers(data);
        },
        complete: function () {
            $j("#form").show("slide", { direction: "right" }, "slow");
            $(".overlay").hide();
            $(".loader").hide();
        }
    });
}
// Autocomplete feature for the UI inputs
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
            // ..--> Send an ajax query to the api at the below URL
            getStops(startStop.trim());
        }
    });      
});
function getStops(startstop) {
    __startStop = startstop
    $.ajax({
        url: localAddress + "/main/stops",
        // Set the start text as the label value
        data: { source: __startStop },
        contentType: "application/json;charset=utf-8",
        dataType: "json",
        error: function (jqXHR, textStatus, errorThrown) {
            console.log(jqXHR);
            $("#form").hide();
            $(".overlay").show();
            $(".loadingcontent").hide();
            $j("#error").show("slide", { direction: "down" }, "fast");
            $("#errorcontent").html('<div class="col-xs-12 px-3 pt-3 mp-5 mobile-col-centered text-center display-4"> :( Oops !</div>' + '<div class="col-xs-12 p-3 display-5"> Error Occurred</div>' + '<div class="col-xs-12 p-3 mp-5">The server responded with: <b>' + jqXHR.status + " Status Code</b></div>" + '<div class="col-xs-12 p-3 mp-5">Error Reason: <b>' + jqXHR.responseJSON.error + " </b></div>" + '<div class="col-xs-12 p-3 mp-5 mobile-col-centered"><button type="button" class="btn btn-danger form-control inputRow px-3 mp-5" id="sendErrorReport" onclick=sendErrorReport()>Send Error Report Now !</button></div>');
        },
        // On success send this data to the receive data function
        success: function (data) {
            startStopAutocompleteData = data;
            // Create a json input for destinations only to select data from the returned filter
            autocomplete_data = [];
            for (var i = 0; i < data.length; i++) {
                if (data[i].stop_id == __startStop) {
                    continue;
                } else {
                    autocomplete_data.push({ label: data[i].stop_name + ", " + data[i].stop_id });
                }
            }
            if (autocomplete_data == []) {
                autocomplete_data.push({ label: "No Destination for this source found" });
            } else {
                $("#destination").attr("placeholder", "Enter Destination").css("background-color", "#ffffff");
                $("#destination").prop('disabled', false);
            }
            if ($("#destination") != "") {
                __oldEndStop = $("#destination").val();
            }
            addMarkers(data, __startStop);
            // refresh autocomplete for destination
            $j("#destination").autocomplete({

                source: autocomplete_data,
                minLength: 1,
                select: function (e, ui) {
                    // alert("Selecting Destination");
                    $("#noDestination").hide();
                    var end = ui.item.label;
                    var stopId = end.split(",");
                    var endStop = stopId[stopId.length - 1];
                    __endStop = endStop.trim();
                    addMarkers(startStopAutocompleteData, __startStop, __endStop);
                }
            });
        }
    });
}

function deactivateDestination(val) {
    if (val.length == 0) {
        $("#destination")
            .val("")
            .attr("placeholder", "Please select source first")
            .css("background-color", "#CFD8DC");
        $("#destination").prop('disabled', true);
        if (markers.length > 0){
            deleteMarkers(markers);
            markers = [];
            if (map){
                map.setZoom(12);
            }
        }
    }
}

$(function () {
   $("#source").keyup(function () {
       var val = $.trim($('#source').val());
       deactivateDestination(val);
       if (val.length==0){
           __startStop = "";
       }
       
   }); 
    $("#source").change(function () {
        var val = $.trim($('#source').val());
        deactivateDestination(val);
        if (val.length == 0) {
            __startStop = "";
        };
    });     
});




// JQuery function to execute when the user clicks Get Travel Time Button
$(function onGetTravelTime() {
    
    $("#getTime").click(function () {
        if (__startStop == "" && __endStop == ""){
            $("#noSource").show();
            $("#sourceDiv").addClass("has-error has-feedback");
            $("#noDestination").show();
        } else if (__startStop == ""){
            $("#noDestination").hide();
            $("#noSource").show();
        } else if (__endStop == ""){
            $("#noSource").hide();
            $("#noDestination").show();
        } else {
            $("#noSource").hide();
            $("#noDestination").hide();
            // $("#home").animate({right:'-250px'});
            $j("#home").hide("slide", { direction: "left" }, "fast",function () {
                $j("#home1").show("slide", { direction: "right" }, "fast");
            });
            // 
            getLines(__startStop, __endStop);
        }
    });
})

$(function onSearchAgain(){
    // If go back to search button is clicked
    $("#goBackSearch").click(function () {
        $j("#home1").hide("slide", { direction: "left" }, "fast", function () {
            $j("#home").show("slide", { direction: "right" }, "fast");
        });
    });
});

/* ----------------------------------------------------------------------- */
/*************************** MANIPULATION OF MARKERS ***********************/
/* ----------------------------------------------------------------------- */
// Function to automatically load markers on the map
var markers = [];
var content_string;
function addMarkers(data, stopid="None", endstop="None"){
    deleteMarkers(markers);
    markers=[];
    var infowindow = new google.maps.InfoWindow();
    var coordinates = [];
    var names = [];
    // if (stopid == "None" && endstop == "None"){
    //     map.setZoom(11);
    // }
    // else if (endstop == "None" || data.length <= 5){
    //     map.setZoom(15);
    // } else  {
    //     map.setZoom(13);
    // }
    // if (data.length<=25){}
    for (var i = 0; i < data.length; i++) {
        // Setting the content string
        
        var stop = { lat: data[i].coord[1], lng: data[i].coord[0] };
        var stop_name = data[i].stop_name;
        var start_icon = "/static/img/markers/StartStop.png";
        var end_icon = "/static/img/markers/EndStop.png";
        var stop_icon_h = "/static/img/markers/HoverStop.png";
        var lasthover;
        var flag = false;
        if (data[i].stop_id == stopid) {
            var stop_icon = start_icon;
            map.setCenter(stop);
            flag = true;
        } else {
            var stop_icon = "/static/img/markers/InterStop.png";
        }
        if (endstop != "None"){
            __endStop = endstop;
            if (data[i].stop_id == endstop) {
                var stop_icon = end_icon;
                map.setCenter(stop);
            }
        }

        var marker = new google.maps.Marker({
          position: stop,
          icon: stop_icon,
          map: map,
          stopid: data[i].stop_id,
          name: stop_name
        });   
        

        // Set a variable that checks whether the user wanted to just hover or click. Because if we add just a mouseout function
        // the infowindow disappears even after the user has clicked on the marker
        // We want the infowindow to stay when clicked and disappear when not
        var hover_status;
        marker.addListener('mouseout', function () {
            // alert("Hover In");            
            this.setOptions({ icon: lasthover });
            if (hover_status){
                infowindow.close(map, this);
            }
            
        });
        
        
        if (flag){
            marker.addListener('mouseover', function () {
                lasthover = this.getIcon();
                // alert("Hover Out");
                content_string = '<div class="iWindow display-5 p-3 mp-5"><div class="row pb-3 mp-5 text-center"><div class="col-xs-12 mobile-col-centered col-centered" id="stopName">' + this.get("name") + '</div></div><div class="row mp-5"><div class="col-xs-6 mobile-col-centered col-centered"><b>Stop Number: </b>' + this.get("stopid") + '</div></div><div class="row p-3 mp-5"><div class="col-xs-6 mobile-col-centered col-centered"><button type="button" class="btn btn-outline-default disabled" id="setSource">Set Source</button></div><div class="col-xs-6 mobile-col-centered col-centered pl-3"><button type="button" class="btn btn-outline-default disabled" id="setDest">Set Destination</button></div></div>';
                infowindow.setContent(content_string);
                this.setOptions({ icon: stop_icon_h });
                infowindow.open(map, this);
                hover_status = true;
            }); 
            marker.addListener("click", function() {
              infowindow.open(map, this);
              hover_status = false;
            }); 
        } else {
            marker.addListener('mouseover', function () {
                lasthover = this.getIcon();
                // alert("Hover Out");
                var marker_name = this.get("name");
                marker_name = marker_name.replace(/(['"])/g, "\\$1");
                content_string = '<div class="iWindow display-5 p-3 mp-5"><div class="row pb-3 mp-5 text-center"><div class="col-xs-12 mobile-col-centered col-centered" id="stopName">' + this.get("name") + '</div></div><div class="row mp-5"><div class="col-xs-6 mobile-col-centered col-centered"><b>Stop Number: </b>' + this.get("stopid") + '</div></div><div class="row p-3 mp-5"><div class="col-xs-6 mobile-col-centered col-centered"><button type="button" class="btn btn-outline-warning" id="setSource" onclick=\"setValueOnForm(\'' + marker_name + "\','" + this.get("stopid") + '\',\'source\')\">Set Source</button></div><div class="col-xs-6 mobile-col-centered col-centered pl-3"><button type="button" class="btn btn-outline-warning" id="setDest" onclick=\"setValueOnForm(\'' + marker_name + "\','" + this.get("stopid") + "','destination')\">Set Destination</button></div></div>";
                
                infowindow.setContent(content_string);
                this.setOptions({ icon: stop_icon_h });
                infowindow.open(map, this);
                hover_status = true;
            });
            marker.addListener("click", function () {
                infowindow.open(map, this);
                hover_status = false;
            }); 
        }
        

        markers.push(marker);    
        // markerHover(map, marker);
        
    }

    setMarker(map);
    setMapBounds();

    // if (stopid=="None" && endstop == "None"){
    //     var markerCluster = new MarkerClusterer(map, markers, {
    //       imagePath: "/static/img/markers/clusterer/m"
    //     });    
    // }
}

function setMapBounds() {
    var bounds = new google.maps.LatLngBounds();
    for (var i = 0; i < markers.length; i++) {
        bounds.extend(markers[i].getPosition());
        var icon = markers[i].getIcon();
        console.log(icon);
        if (icon =="/static/img/markers/StartStop.png"){
            map.setCenter(markers[i]);
        }
    }
    map.fitBounds(bounds);
    var listener = google.maps.event.addListener(map, "bounds_changed", function () {
        if (map.getZoom() > 16) map.setZoom(16);
        google.maps.event.removeListener(listener);
    });
    
}
// Set inividual marker on the map
function setMarker(map) {
    for (var i =0; i < markers.length; i++){
        markers[i].setMap(map);
    }
}

// Clear the markers from the map
function clearMarkers(){
    setMarker(null);
}

// Function to delete markers from the map
function deleteMarkers(markers){
    console.log("Deleting all stops");
    clearMarkers();
    markers = [];
}

// });
function setValueOnForm(address, stopid, flag) {
    $("#pac-input").val("");
    current_flag = false;
    if (flag=='source'){
        // If the source button is clicked set the new source value as the concat of the address and the stopid
        var source_new_value = address + ', '+stopid;
        if ($("#source").val()!=""){
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
        var destination_new_value = address + ', ' + stopid;
        if ($("#source").val() != "") {
            __oldStartStop = $("#source").val();
        }
        if ($("#destination").val() != "") {
            __oldEndStop = $("#destination").val();
        }
        $("#destination").val(destination_new_value);
        addMarkers(startStopAutocompleteData, __startStop, stopid);
        
    }
    var visibility = $("#home").is(":visible");
    if (visibility == false) {
        $("#goBackSearch").click();
    }
}

$(function(){
    $("#undo").click(function () {
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
            console.log(jqXHR);
            $("#form").hide();
            $(".overlay").show();
            $(".loadingcontent").hide();
            $j("#error").show("slide", { direction: "down" }, "fast");
            $("#errorcontent").html('<div class="col-xs-12 px-3 pt-3 mp-5 mobile-col-centered text-center display-4"> :( Oops !</div>' + '<div class="col-xs-12 p-3 display-5"> Error Occurred</div>' + '<div class="col-xs-12 p-3 mp-5">The server responded with: <b>' + jqXHR.status + " Status Code</b></div>" + '<div class="col-xs-12 p-3 mp-5">Error Reason: <b>' + jqXHR.statusText + " </b></div>" + '<div class="col-xs-12 p-3 mp-5 mobile-col-centered"><button type="button" class="btn btn-danger form-control inputRow px-3 mp-5" id="sendErrorReport" onclick=sendErrorReport()>Send Error Report Now !</button></div>');
        },
      contentType: "application/json;charset=utf-8",
      dataType: "json",
      success: function (data) {
          $("#lineholder").show();
          $("#linecontent").html('');
          for (var i = 0; i < data.length; i ++){
              $('<div class= "col-sm-2 col-xs-2 px-3 btn btn-info" id="lineid" onclick=getTravelTime(this)>' + data[i] + "</div>").appendTo("#linecontent");
          }
      }
    });
}
function getTravelTime(content) {
    var datetime = (moment($("#datetime").val(), "YYYY-MM-DDTHH:mm").valueOf())/1000;
    var rain = "0.5"
    var url1 = 'https://data.smartdublin.ie/cgi-bin/rtpi/realtimebusinformation?stopid=';
    var url3 = '&format=json';
    var live_db = url1.concat(__startStop, url3);
    var proxy = 'https://cors-anywhere.herokuapp.com/';
    var darksky = "https://api.darksky.net/forecast/49d7bd97c9c756cb539c7bf0befee061/53.3551,-6.2493";
    var weather_url = proxy.concat(darksky);
        $.getJSON(weather_url, function(weather) {
            console.log(weather.currently.precipIntensity);
            var rain = weather.currently.precipIntensity;
    });
    $.ajax({
        url: localAddress + "/main/journeytime",
        data: {
            source: __startStop,
            destination: __endStop,
            lineid: content.innerHTML,
            time: datetime,
            rain: rain,
        },
        contentType: "application/json;charset=utf-8",
        dataType: "json", 
        error: function (jqXHR, textStatus, errorThrown) {
            console.log(jqXHR);
            $("#form").hide();
            $(".overlay").show();
            $(".loadingcontent").hide();
            $j("#error").show("slide", { direction: "down" }, "fast");
            $("#errorcontent").html('<div class="col-xs-12 px-3 pt-3 mp-5 mobile-col-centered text-center display-4"> :( Oops !</div>' + '<div class="col-xs-12 p-3 display-5"> Error Occurred</div>' + '<div class="col-xs-12 p-3 mp-5">The server responded with: <b>' + jqXHR.status + " Status Code</b></div>" + '<div class="col-xs-12 p-3 mp-5">Error Reason: <b>' + jqXHR.statusText + " </b></div>" + '<div class="col-xs-12 p-3 mp-5 mobile-col-centered"><button type="button" class="btn btn-danger form-control inputRow px-3 mp-5" id="sendErrorReport" onclick=sendErrorReport()>Send Error Report Now !</button></div>');
        },
        success: function (data) {
            $("#journeyholder").show();
            $("#journeycontent").html("");
            $('<div class= "col-sm-6 text-center">Route: </div><div class= "col-sm-6 text-center"><b>' + content.innerHTML + "</b> </div>").appendTo("#journeycontent");
            $('<div class= "col-sm-6 text-center">Journey Time: </div><div class= "col-sm-6 text-center"><b>' + data.totaltraveltime + "</b> </div>").appendTo("#journeycontent");
            $('<div class= "col-sm-6 text-center">Arrival Time: </div><div class= "col-sm-6 text-center"><b>' + data.arrivaltime + "</b> </div>").appendTo("#journeycontent");
            $.getJSON(live_db, function(bus) {
                var nextbuses = [];
                var nextbus = "";
                for (var i = 0; i < bus.results.length; i++) {
                    var iarr = bus.results[i];
                    if (iarr.route == content.innerHTML) {
                        nextbuses.push(bus.results[i].duetime);
                    }
                }
                if (nextbuses[0] != "Due") {
                    var nextbus = nextbuses[0] + " mins";
                }
                else if (nextbuses[0] == "1") {
                    var nextbus = nextbuses[0] + " min";
                }
                else {
                    var nextbus = nextbuses[0];
                }
                $('<div class= "col-sm-6 text-center">Next bus arriving in: </div><div class= "col-sm-6 text-center"><b>' + nextbus + "</b> </div>").appendTo("#journeycontent");
            });
        }
    });


    
}

function sendErrorReport(){
    $j("#errorcontent").hide("slide", { direction: "right" }, "fast", function () {
        $j("#errorsent").show("slide", { direction: "right" }, "fast");
    });
    
}

$(function () {
    $("#closeError").click(function () {
      $("#error").hide();
      $(".overlay").hide();
      $("form").show();
      location.reload();
    });
})
// This is the major Display Map function
// function displayMap(data2, startBusStop){
//         var coordinates2 = [];
//         var names = [];
//         for (var i = 0; i < data2.length; i++) {
//             var iarr = data2[i];
//             coordinates2.push({ lat: iarr.coord[1], lng: iarr.coord[0] });
//             names.push(iarr.stop_name);
//         }
        
//         var stop_icon = {
//             path: 'M0,0a8,8 0 1,0 16,0a8,8 0 1,0 -16,0',
//             fillColor: '#e6f2ff',
//             fillOpacity: 0.8,
//             scale: 1,
//             strokeColor: '#99ccff',
//             strokeWeight: 1
//         };
//         var stop_icon_h = {
//             path: 'M0,0a8,8 0 1,0 16,0a8,8 0 1,0 -16,0',
//             fillColor: 'yellow',
//             fillOpacity: 0.8,
//             scale: 1,
//             strokeColor: 'blue',
//             strokeWeight: 1
//         };
//         for (var i = 0; i < coordinates2.length; i++) {
//             var stop = coordinates2[i];
//             var stop_name = names[i];

//             var bus_stop = new google.maps.Marker({
//                 position: stop,
//                 icon: stop_icon,
//                 map: map
//             });

//             showHideMarker(map, bus_stop, stop_name);
//         };
//         bus_stop.setMap(map);
//         function showHideMarker(map, bus_stop) {
//             var infowindow = new google.maps.InfoWindow({
//                 content: stop_name
//             });

//             bus_stop.addListener('mouseout', function () {
//                 bus_stop.setOptions({ icon: stop_icon });
//                 infowindow.close(bus_stop.get('map'), bus_stop);
//             });

//             bus_stop.addListener('mouseover', function () {
//                 bus_stop.setOptions({ icon: stop_icon_h });
//                 infowindow.open(bus_stop.get('map'), bus_stop);
//             });
//         };
// }
// Display Map Function ------------------------------

