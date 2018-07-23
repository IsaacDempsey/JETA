
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

// Window resize add and remove classes and show hide toggle buttons
function resizeWindow() {
    // $j(".mobile-form").css('width', $(window).width());
    if ($(window).width() <= 650) {
        // //console.log("Width: ",($(window).width()-25));
        // $("#pac-input").css('width',$(window).width());
        $("#toggle-button").show();
        $("#navbarToggleExternalContent").addClass("collapse");
        $j("#form").position({
                my: "right center",
                at: "right",
                of: ".wrapper"
            });
        
    } else {
        $("#toggle-button").hide();
        $("#navbarToggleExternalContent").removeClass("collapse");
    }
}


// On Document Ready
$(document).ready(function () {
    // When the document loads
    // Window resize add and remove classes and show hide toggle buttons
    resizeWindow();
    $(window).resize(function () {
        resizeWindow();
    });
    $("#toggle-button").click(function () {
        var measure = ($(window).width() - $j("#form").position().left);
        
        if (measure>150){
            //console.log(measure);
            $("#form").css("paddingRight", "0px");
            // $j("#form").position({
            //     my: "center",
            //     at: "right",
            //     of: "body"
            // });
        } else {
            $("#form").css("paddingRight", '250px');
            
            // $j("#form").position(
            //     {
            //         my: "center",
            //         at: "center",
            //         of: "body"
            //     }
            // );
        }
        
        
    });
    // Autoload the date for the user with the current date
    let today = moment().format("YYYY-MM-DD");
    document.querySelector("#date").value = today;
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
    //close marker window on phone
    $('.close').click(function () {
        $j(".mobile-markerwindow").hide("slide", { direction: "down" }, "fast");
    });
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
            zoomControl: false,
            zoomControlOptions: {
                position: google.maps.ControlPosition.LEFT_CENTER
            },
            scaleControl: true,
            streetViewControl: false,
            streetViewControlOptions: {
                position: google.maps.ControlPosition.LEFT_TOP
            },
            fullscreenControl: false,
            zoom: 12,
            styles: mapstyle
        });

        // $.getJSON('/static/json/routes.json', function(data) {
        //     var coordinates_arr = [];
     
        //     //iterates through each key in json
        //     $.each(data, function(index, data) {
        //     var coordinates = [];
        //     for (var i = 0; i < data.length; i++) {
        //     var iarr = data[i];
        //     coordinates.push({lat: iarr[1], lng: iarr[0]});
        //     if (i == data.length - 1) {
        //         coordinates_arr.push(coordinates);
        //         coordinates = [];
        //     }
        //     }
        //     })
        //  for (var i = 0; i < coordinates_arr.length; i++) {
        //  var line = coordinates_arr[i];
        //  var busroute = new google.maps.Polyline({
        //     path: line,
        //     geodesic: true,
        //     strokeColor: '#b3ccff',
        //     strokeOpacity: 1.0,
        //     strokeWeight: 2
        //   });
     
        //   busroute.setMap(map);
        //       };
        //     });

        // Auto complete of generic search to plot bus stops near a paricular location
        // Create the search box and link it to the UI element.
        var input = document.getElementById('pac-input');
        var searchform = document.getElementById("sForm");
        var searchBox = new google.maps.places.SearchBox(input);
        var marker = "";
        map.controls[google.maps.ControlPosition.TOP_LEFT].push(input);
        map.controls[google.maps.ControlPosition.LEFT_TOP].push(searchform);
        
        

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
                // console.log(places);
                is_places_entered = true;
                lat = places[0].geometry.location.lat();
                lng = places[0].geometry.location.lng();
                var myLatLng = { lat: places[0].geometry.location.lat(), lng: places[0].geometry.location.lng() };
                if(marker != ""){
                    // console.log(map.contains(marker.getPosition()));
                    if (marker.getMap() != ""){
                        marker.setMap(null);
                    }
                    if (map
                        .getBounds()
                        .contains(marker.getPosition())){
                            marker.setMap(null);
                        }
                }
                
                marker = new google.maps.Marker({
                    position: myLatLng,
                    map: map
                });
                map.setCenter(marker);
                // //console.log(places[0].geometry.location.lat());
                // //console.log(places[0].geometry.location.lng());
                runGenericStopLoader(lat,lng,radius);
            }

        });
        function runCurrentStopLoader(position){
            current_flag = true;
            lat = position.coords.latitude;
            lng = position.coords.longitude;
            var myLatLng = { lat: position.coords.latitude, lng: position.coords.longitude };
            if (marker != "") {
                if (marker.getMap() != "") {
                    marker.setMap(null);
                }
                if (map
                    .getBounds()
                    .contains(marker.getPosition())) {
                    marker.setMap(null);
                }
            }

            marker = new google.maps.Marker({
                position: myLatLng,
                map: map
            });
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
        //console.log(jqXHR);
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
    //console.log("Loading all Stops");
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
            // ..--> Send an ajax query to the api at the below URL
            getStops(startStop.trim());
        }
    });      
});



// function getFinalStops() {
//     $.ajax({
//         url: localAddress + "/main/get_route",
//         // Set the start text as the label value
//         data: { 
//             source: __startStop,
//             destination: __endStop,
//             },
//         contentType: "application/json;charset=utf-8",
//         dataType: "json",
//         error: function (jqXHR, textStatus, errorThrown) {
//             console.log(jqXHR);
//             $("#form").hide();
//             $(".overlay").show();
//             $(".loadingcontent").hide();
//             $j("#error").show("slide", { direction: "down" }, "fast");
//             $("#errorcontent").html('<div class="col-xs-12 px-3 pt-3 mp-5 mobile-col-centered text-center display-4"> :( Oops !</div>' + '<div class="col-xs-12 p-3 display-5"> Error Occurred</div>' + '<div class="col-xs-12 p-3 mp-5">The server responded with: <b>' + jqXHR.status + " Status Code</b></div>" + '<div class="col-xs-12 p-3 mp-5">Error Reason: <b>' + jqXHR.responseJSON.error + " </b></div>" + '<div class="col-xs-12 p-3 mp-5 mobile-col-centered"><button type="button" class="btn btn-danger form-control inputRow px-3 mp-5" id="sendErrorReport" onclick=sendErrorReport()>Send Error Report Now !</button></div>');
//         },
//         // On success send this data to the receive data function
//         success: function (data) {
            
//         }
//     });
// }





// This function draws final user route of their selected bus journey
// function getFinalStops() {
//     $.ajax({
//         url: localAddress + "/main/get_route",
//         // Set the start text as the label value
//         data: { 
//             source: __startStop,
//             destination: __endStop,
//             },
//         contentType: "application/json;charset=utf-8",
//         dataType: "json",
//         error: function (jqXHR, textStatus, errorThrown) {
//             console.log(jqXHR);
//             $("#form").hide();
//             $(".overlay").show();
//             $(".loadingcontent").hide();
//             $j("#error").show("slide", { direction: "down" }, "fast");
//             $("#errorcontent").html('<div class="col-xs-12 px-3 pt-3 mp-5 mobile-col-centered text-center display-4"> :( Oops !</div>' + '<div class="col-xs-12 p-3 display-5"> Error Occurred</div>' + '<div class="col-xs-12 p-3 mp-5">The server responded with: <b>' + jqXHR.status + " Status Code</b></div>" + '<div class="col-xs-12 p-3 mp-5">Error Reason: <b>' + jqXHR.responseJSON.error + " </b></div>" + '<div class="col-xs-12 p-3 mp-5 mobile-col-centered"><button type="button" class="btn btn-danger form-control inputRow px-3 mp-5" id="sendErrorReport" onclick=sendErrorReport()>Send Error Report Now !</button></div>');
//         },
//         // On success send this data to the receive data function
//         success: function (data) {
//             finalData = data;
//             var coordinates_arr = [];
//             var coordinates = [];
//             for (var i = 0; i < finalData.length; i++) {
//             var iarr = finalData[i];
//             coordinates.push({lat: iarr.coord[1], lng: iarr.coord[0]});
//             }
//             coordinates_arr.push(coordinates);
//                 var line = coordinates_arr[0];
//                 var route = new google.maps.Polyline({
//                    path: line,
//                    geodesic: true,
//                    strokeColor: '#000099',
//                    strokeOpacity: 1.0,
//                    strokeWeight: 5,
//                    zIndex: 1
//                  });
                 
//                  route.setMap(map);
//                  addMarkers(finalData, __startStop, __endStop);
//         }
//     });
// }
function getStops(startstop) {
    __startStop = startstop
    $.ajax({
        url: localAddress + "/main/stops",
        // Set the start text as the label value
        data: { source: __startStop },
        contentType: "application/json;charset=utf-8",
        dataType: "json",
        error: function (jqXHR, textStatus, errorThrown) {
            //console.log(jqXHR);
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
                    deleteRoute();
                    // alert("Selecting Destination");
                    $("#noDestination").hide();
                    var end = ui.item.label;
                    var stopId = end.split(",");
                    var endStop = stopId[stopId.length - 1];
                    // console.log(endStop);
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
        $("#journeyholder").hide();
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
    //console.log(data);
    deleteMarkers(markers);
    markers=[];
    var infowindow = new google.maps.InfoWindow();
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
        var start_icon = {
            path: 'M0,0a8,8 0 1,0 16,0a8,8 0 1,0 -16,0',
            fillColor: '#00b33c',
            fillOpacity: 0.4,
            scale: 1,
            strokeColor: '#00b33c',
            strokeWeight: 2
          };
        var end_icon = {
            path: 'M0,0a8,8 0 1,0 16,0a8,8 0 1,0 -16,0',
            fillColor: '#e62e00',
            fillOpacity: 0.4,
            scale: 1,
            strokeColor: '#e62e00',
            strokeWeight: 2
        };
        var stop_icon_h = {
            path: 'M0,0a8,8 0 1,0 16,0a8,8 0 1,0 -16,0',
            fillColor: '#ff8533',
            fillOpacity: 0.4,
            scale: 1,
            strokeColor: '#ff8533',
            strokeWeight: 2
          };
        var lasthover;
        var flag = false;
        if (data[i].stop_id == stopid) {
            var stop_icon = start_icon;
            map.setCenter(stop);
            flag = true;
        } else {
            var stop_icon = {
                path: 'M0,0a8,8 0 1,0 16,0a8,8 0 1,0 -16,0',
                fillColor: '#66a3ff',
                fillOpacity: 0.4,
                scale: 1,
                strokeColor: '#0000b3',
                strokeWeight: 2
              };
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
        if ($(window).width() < 650) {
            if(flag){
                marker.addListener("click", function () {
                    $j(".mobile-markerwindow").show("slide", { direction: "down" }, "fast");
                    $("#markerwindow-content").html("");
                    content_string = '<div class="row pb-3"><div class="col-xs-12 mobile-col-centered" id="stopName" style="color: #fff">' + this.get("name") + ' </div></div> <div class="row pb-3"><div class="col-xs-12 mobile-col-centered" id="stopNumber" style="color: #fff"><b>Stop Number: </b>' + this.get("stopid") + ' </div></div> <div class="row"><div class="col-xs-6 mobile-col-centered"><button type="button" class="btn btn-outline-default disabled" id="setSource">Set Source</button></div><div class="col-xs-6 mobile-col-centered"><button type="button" class="btn btn-outline-default disabled" id="setDest">Set Destination</button></div></div></div>';
                    $(content_string).appendTo("#markerwindow-content");
                    this.setOptions({ icon: stop_icon_h });
                }); 
            } else {
                marker.addListener("click", function() {
                    $j(".mobile-markerwindow").show("slide", { direction: "down" }, "fast");
                    $("#markerwindow-content").html("");
                    var marker_name = this.get("name");
                    marker_name = marker_name.replace(/(['"])/g, "\\$1");
                    content_string = '<div class="row pb-3"><div class="col-xs-12 mobile-col-centered" id="stopName" style="color: #fff">' + this.get("name") + ' </div></div> <div class="row pb-3"><div class="col-xs-12 mobile-col-centered" id="stopNumber" style="color: #fff"><b>Stop Number: </b>' + this.get("stopid") + ' </div></div> <div class="row"><div class="col-xs-6 mobile-col-centered"><button type="button" class="btn btn-outline-warning" id="setSource" onclick="setValueOnForm(\'' + marker_name + "','" + this.get("stopid") + '\',\'source\')">Set Source</button></div><div class="col-xs-6 mobile-col-centered pl-3"><button type="button" class="btn btn-outline-warning" id="setDest" onclick="setValueOnForm(\'' + marker_name + "','" + this.get("stopid") + "','destination')\">Set Destination</button></div></div></div>";
                    $(content_string).appendTo("#markerwindow-content");
                    this.setOptions({ icon: stop_icon_h });
                }); 
            }
        } else {
            if (flag) {
                marker.addListener('mouseover', function () {
                    lasthover = this.getIcon();
                    // alert("Hover Out");
                    content_string = '<div class="iWindow display-5 p-3 mp-5"><div class="row pb-3 mp-5 text-center"><div class="col-xs-12 mobile-col-centered col-centered" id="stopName">' + this.get("name") + '</div></div><div class="row mp-5"><div class="col-xs-6 mobile-col-centered col-centered"><b>Stop Number: </b>' + this.get("stopid") + '</div></div><div class="row p-3 mp-5"><div class="col-xs-6 mobile-col-centered col-centered"><button type="button" class="btn btn-outline-default disabled" id="setSource" >Set Source</button></div><div class="col-xs-6 mobile-col-centered col-centered pl-3"><button type="button" class="btn btn-outline-default disabled" id="setDest">Set Destination</button></div></div>';
                    infowindow.setContent(content_string);
                    this.setOptions({ icon: stop_icon_h });
                    infowindow.open(map, this);
                    hover_status = true;
                });
                marker.addListener("click", function () {
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
    var center_point="";
    for (var i = 0; i < markers.length; i++) {
        bounds.extend(markers[i].getPosition());
        var icon = markers[i].getIcon();
        //console.log(icon);
        if (icon =="/static/img/markers/StartStop.png"){
            center_point = markers[i];
        }
    }
    map.fitBounds(bounds);
    var listener = google.maps.event.addListener(map, "bounds_changed", function () {
        if (map.getZoom() > 16){
            if (center_point != ""){
                map.setCenter(center_point);
            }            
            map.setZoom(16);
        } 
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
    //console.log("Deleting all stops");
    clearMarkers();
    markers = [];
}

function deleteRoute(){
    if (route!=""){
        //Delete the routes
        route.setMap(null);
        return;
    } else {
        return;
    }
}
// });
function setValueOnForm(address, stopid, flag) {
    deleteRoute();
    $("#pac-input").val("");
    current_flag = false;
    if (flag=='source'){
        if ($(window).width() < 650) {
            $j(".mobile-markerwindow").hide("slide", { direction: "down" }, "fast");
        }
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
        if ($(window).width() < 650) {
            $j(".mobile-markerwindow").hide("slide", { direction: "down" }, "fast");
            $("#toggle-button").click();
        }
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
            //console.log(jqXHR);
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
          $("#line-pills").html('');
          for (var i = 0; i < data.length; i ++){
              $('<li class="nav-item"><a class="nav-link active" href="#" id="lineid" onclick=getTravelTime(this)>' + data[i] + "</a></li>").appendTo("#line-pills");
          }
      }
    });
}

function leaveNow() {
    var today = moment().format("YYYY-MM-DDTHH:mm");
    var hour_slice = today.slice(11, 13);
    var mins_slice = today.slice(14, 16);

    var new_hour = document.getElementById("hour");
    var new_option1 = document.createElement("option");
    new_option1.value = hour_slice;
    new_hour.add(new_option1);
    var new_mins = document.getElementById("mins");
    var new_option2 = document.createElement("option");
    new_option2.text = mins_slice;
    new_option2.value = mins_slice;
    new_mins.add(new_option2);

    document.getElementById('hour').value = hour_slice;
    document.getElementById('mins').value = mins_slice;
}


function getTravelTime(content) {
    deleteRoute();
    $("#journeyholder").show();

    var hour1 = document.getElementById("hour");
    var hour = hour1[hour1.selectedIndex].value
    var mins1 = document.getElementById("mins");
    var mins = mins1[mins1.selectedIndex].value
    var datetime_future_str = $("#date").val().concat("T", hour, mins);
    var datetime = (moment(datetime_future_str, "YYYY-MM-DDTHH:mm").valueOf())/1000;

    // var datetime = (moment($("#datetime").val(), "YYYY-MM-DDTHH:mm").valueOf())/1000;
    var rain = "0.5";
    var proxy = 'https://cors-anywhere.herokuapp.com/';
    var darksky = "https://api.darksky.net/forecast/49d7bd97c9c756cb539c7bf0befee061/53.3551,-6.2493";
    var weather_url = proxy.concat(darksky);
        $.getJSON(weather_url, function(weather) {
            var current_time = Math.round((new Date()).getTime() / 1000);
            // if time with hour of current time, use current rainfall
            if (datetime <= current_time + 3600 && datetime >= current_time - 3600) {
                var rain = weather.currently.precipIntensity;
            }
            else {
                for (var i = 0; i < weather.hourly.data.length; i++) {
                    var iarr = weather.hourly.data[i];
                    //console.log(iarr.precipIntensity);
                    if (datetime <= iarr.time + 3600 && datetime >= iarr.time - 3600) {
                    var rain = iarr.precipIntensity;
                }
            }
        }
           // console.log(rain);
    });
    var lin = content.innerHTML;
    startStopAutocompleteData.sort(function (a, b) {
        return Number(a.lineid[lin]) - Number(b.lineid[lin]);
    });
    getRoute(startStopAutocompleteData, lin);
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
            $("#form").hide();
            $(".overlay").show();
            $(".loadingcontent").hide();
            $j("#error").show("slide", { direction: "down" }, "fast");
            $("#errorcontent").html('<div class="col-xs-12 px-3 pt-3 mp-5 mobile-col-centered text-center display-4"> :( Oops !</div>' + '<div class="col-xs-12 p-3 display-5"> Error Occurred</div>' + '<div class="col-xs-12 p-3 mp-5">The server responded with: <b>' + jqXHR.status + " Status Code</b></div>" + '<div class="col-xs-12 p-3 mp-5">Error Reason: <b>' + jqXHR.statusText + " </b></div>" + '<div class="col-xs-12 p-3 mp-5 mobile-col-centered"><button type="button" class="btn btn-danger form-control inputRow px-3 mp-5" id="sendErrorReport" onclick=sendErrorReport()>Send Error Report Now !</button></div>');
        },
        success: function (data) {
            var nextbus = "";
            var totaltraveltime = data.totaltraveltime;
            var arrivaltime = data.arrivaltime;
            $("#journeyholder").show();
            $("#journeycontent").html("");
            getRTPIArrivalTIme(lineid);
            function addMinutes(time, minsToAdd) {
                function D(J) { return (J < 10 ? '0' : '') + J; };
                var piece = time.split(':');
                var mins = piece[0] * 60 + +piece[1] + +minsToAdd;

                return D(mins % (24 * 60) / 60 | 0) + ':' + D(mins % 60);
            }
            //console.log(nextbus);
            
            $('<div class="row px-3"><div class= "col-xs-6">Route: </div><div class= "col-xs-6 px-3"><b>' + lin + "</b> </div></div>").appendTo("#journeycontent");
            $('<div class="row px-3"><div class= "col-xs-6">Journey Time: </div><div class= "col-xs-6 px-3"><b>' + totaltraveltime + "</b> </div></div>").appendTo("#journeycontent");
            $('<div class="row px-3"><div class= "col-xs-6">Arrival Time: </div><div class= "col-xs-6 px-3"><b>' + arrivaltime + "</b> </div></div>").appendTo("#journeycontent");
            $('<div class="row px-3"><div class= "col-xs-6">Next bus arriving in: </div><div class= "col-xs-6 px-3"><b>' + nextbus + "</b> </div></div>").appendTo("#journeycontent");
        }
    });


    
}
var nextBus = "";
function getRTPIArrivalTIme(lineid){
    var url1 = "https://data.smartdublin.ie/cgi-bin/rtpi/realtimebusinformation?stopid=";
    var url3 = "&format=json";
    var live_db = url1.concat(__startStop, url3);
    $.getJSON(live_db, function (bus) {
        var nextbuses = [];
        console.log(lineid);
        console.log(bus)
        for (var i = 0; i < bus.results.length; i++) {
            var iarr = bus.results[i];
            if (iarr.route == lineid) {
              nextbuses.push(bus.results[i].duetime);
            }
        }
        console.log(nextbuses);
        if (nextbuses.length == 0) {
            nextbus = "No live bus information available.";
            arrivaltime = "--:--:--";
        } else {
            nextbus = Math.min(...nextbuses);
            if (nextbus == 1) {
                arrivaltime = addMinutes(arrivaltime, nextbus);
                nextbus = String(nextbus) + " min";

            } else {
                arrivaltime = addMinutes(arrivaltime, nextbus);
                nextbus = String(nextbus) + " mins";
                console.log(arrivaltime);
            }
        }
        console.log(nextbus);
        // console.log(nextbuses.length);

        function addMinutes(time, minsToAdd) {
            function D(J) { return (J < 10 ? '0' : '') + J; };
            var piece = time.split(':');
            var mins = piece[0] * 60 + +piece[1] + +minsToAdd;

            return D(mins % (24 * 60) / 60 | 0) + ':' + D(mins % 60);
        }
    });
    // console.log("Next Bus: ",nextBus);
}
var route = "";
function getRoute(data,line) {
    var routeData = [];
    var firstStop = 0;
    var lastStop;
    
    for (var i =0 ; i < data.length; i++){
        if (data[i].stop_id==__endStop){
            lastStop = Number(data[i].lineid[line]);
        }
    }
    for (var i=0; i<data.length;i++){
        if (data[i].lineid[line]>= firstStop && data[i].lineid[line] <= lastStop) {
            routeData.push(data[i]);
        }
    }
    routeData.sort(function(a, b) {
      return Number(a.lineid[line]) - Number(b.lineid[line]);
    });
    // finalData = data;
    var coordinates = [];
    for (var i = 0; i < routeData.length; i++) {
        coordinates.push({
          lat: routeData[i].coord[1],
          lng: routeData[i].coord[0]
        });
    }
    route = new google.maps.Polyline({
        path: coordinates,
        geodesic: true,
        strokeColor: 'yellow',
        strokeOpacity: 1.0,
        strokeWeight: 8
    });
    deleteRoute();
    route.setMap(map);
    addMarkers(routeData,__startStop,__endStop);
    
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

