// LOCAL ADDRESS TO BE DYNAMIC
var localAddress = window.location.protocol; // Local url
var $j = jQuery.noConflict(); // No conflict with the major jquery for autocomplete widget
// Creating a Global Map Object
var map;
$(document).ready(function () {
    loadMap();
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
            streetViewControl: false,
            streetViewControlOptions: {
                position: google.maps.ControlPosition.LEFT_TOP
            },
            fullscreenControl: false,
            zoom: 12,
            styles: mapstyle
        });

        $.getJSON('/static/json/routes.json', function (data) {
            var coordinates_arr = [];

            //iterates through each key in json
            $.each(data, function (index, data) {
                var coordinates = [];
                for (var i = 0; i < data.length; i++) {
                    var iarr = data[i];
                    coordinates.push({ lat: iarr[1], lng: iarr[0] });
                    if (i == data.length - 1) {
                        coordinates_arr.push(coordinates);
                        coordinates = [];
                    }
                }
            })
            for (var i = 0; i < coordinates_arr.length; i++) {
                var line = coordinates_arr[i];
                var busroute = new google.maps.Polyline({
                    path: line,
                    geodesic: true,
                    strokeColor: '#b3ccff',
                    strokeOpacity: 1.0,
                    strokeWeight: 2
                });

                busroute.setMap(map);
            };
        });

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
            console.log("Geolocation is not supported by this browser.");
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
                if (marker != "") {
                    // console.log(map.contains(marker.getPosition()));
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
                map.setCenter(marker);
                // //console.log(places[0].geometry.location.lat());
                // //console.log(places[0].geometry.location.lng());
                runGenericStopLoader(lat, lng, radius);
            }

        });
        function runCurrentStopLoader(position) {
            deleteRoute();
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
        function runGenericStopLoader(lat, lng, radius) {
            deleteRoute();
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
        globalMap(map);
    });
}


function globalMap(Asyncmap) {
    // We need a new javascript function to set the map as a global variable because, the map is loaded asynchronously
    // using a json mapstyle, hence everythin will be executed before the map loads, this function will be called in the 
    // end of the load. Hence setting the map globally.
    map = Asyncmap;
}

// The below function loads all the generic stop on page load
function loadGenericStops(latitude, longitude, rad) {
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
          $(".switch_note_content").hide();
        $j("#error").show("slide", { direction: "down" }, "fast");
          $("#errorcontent").html('<div class="col-xs-12 px-3 pt-3 mp-5 mobile-col-centered text-center display-4"> :( Oops !</div>' + '<div class="col-xs-12 p-3 display-5"> Error Occurred</div>' + '<div class="col-xs-12 p-3 mp-5">The server responded with: <b>' + jqXHR.status + " Status Code</b></div>" + '<div class="col-xs-12 p-3 mp-5">Error Reason: <b>' + jqXHR.responseJSON.error + " </b></div>" + '<div class="col-xs-12 p-3 mp-5 mobile-col-centered"><button type="button" class="btn btn-danger form-control inputRow px-3 mp-5" id="sendErrorReport" onclick=sendErrorReport()>Send Error Report Now !</button></div>');
      },
      success: function(data) {
        addMarkers(data);
      }
    });
}

/* ----------------------------------------------------------------------- */
/*************************** MANIPULATION OF MARKERS ***********************/
/* ----------------------------------------------------------------------- */
// Function to automatically load markers on the map
var markers = [];
var content_string;
function addMarkers(data, stopid = "None", endstop = "None") {
    //console.log(data);
    deleteMarkers(markers);
    markers = [];
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
        if (endstop != "None") {
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
            if (hover_status) {
                infowindow.close(map, this);
            }

        });
        if ($(window).width() < 650) {
            if (flag) {
                marker.addListener("click", function () {
                    $j(".mobile-markerwindow").show("slide", { direction: "down" }, "fast");
                    $("#markerwindow-content").html("");
                    var marker_name = this.get("name");
                    marker_name = marker_name.replace(/(['"])/g, "\\$1");
                    content_string = '<div class="row pb-3"><div class="col-xs-12 mobile-col-centered" id="stopName" style="color: #fff">' + this.get("name") + ' </div></div> <div class="row pb-3"><div class="col-xs-12 mobile-col-centered" id="stopNumber" style="color: #fff"><b>Stop Number: </b>' + this.get("stopid") + ' </div></div> <div class="row"><div class="col-xs-6 mobile-col-centered"><button type="button" class="btn btn-outline-warning disabled" id="setSource" onclick="setValueOnForm(\'' + marker_name + "','" + this.get("stopid") + '\',\'source\')">Set Source</button></div><div class="col-xs-6 mobile-col-centered pl-3"><button type="button" class="btn btn-outline-warning disabled" id="setDest" onclick="getswitch(' + this.get("stopid") + ");setValueOnForm('" + marker_name + "','" + this.get("stopid") + "','destination')\">Set Destination</button></div></div></div><div class='row p - 3 mp - 5'><div class='col - xs mobile - col - centered col - centered'><button type='button' class='btn btn-outline-info' onClick=\"openScheduleforStop(" + '"' + marker_name + '",' + this.get("stopid") + ')" >Open Schedule</button></div></div>';
                    $(content_string).appendTo("#markerwindow-content");
                    this.setOptions({ icon: stop_icon_h });
                });
            } else {
                if (__startStop != "") {
                    marker.addListener("click", function () {
                        $j(".mobile-markerwindow").show("slide", { direction: "down" }, "fast");
                        $("#markerwindow-content").html("");
                        var marker_name = this.get("name");
                        marker_name = marker_name.replace(/(['"])/g, "\\$1");
                        content_string = '<div class="row pb-3"><div class="col-xs-12 mobile-col-centered" id="stopName" style="color: #fff">' + this.get("name") + ' </div></div> <div class="row pb-3"><div class="col-xs-12 mobile-col-centered" id="stopNumber" style="color: #fff"><b>Stop Number: </b>' + this.get("stopid") + ' </div></div> <div class="row"><div class="col-xs-6 mobile-col-centered"><button type="button" class="btn btn-outline-warning" id="setSource" onclick="setValueOnForm(\'' + marker_name + "','" + this.get("stopid") + '\',\'source\')">Set Source</button></div><div class="col-xs-6 mobile-col-centered pl-3"><button type="button" class="btn btn-outline-warning" id="setDest" onclick="getswitch(' + this.get("stopid") + ");setValueOnForm('" + marker_name + "','" + this.get("stopid") + "','destination')\">Set Destination</button></div></div></div><div class='row p - 3 mp - 5'><div class='col - xs mobile - col - centered col - centered'><button type='button' class='btn btn-outline-info' onClick=\"openScheduleforStop(" + '\"' + marker_name + '\",' + this.get("stopid") + ')\" >Open Schedule</button></div></div>';
                        $(content_string).appendTo("#markerwindow-content");
                        this.setOptions({ icon: stop_icon_h });
                    });
                } else {
                    marker.addListener("click", function () {
                        $j(".mobile-markerwindow").show("slide", { direction: "down" }, "fast");
                        $("#markerwindow-content").html("");
                        var marker_name = this.get("name");
                        marker_name = marker_name.replace(/(['"])/g, "\\$1");
                        content_string = '<div class="row pb-3"><div class="col-xs-12 mobile-col-centered" id="stopName" style="color: #fff">' + this.get("name") + ' </div></div> <div class="row pb-3"><div class="col-xs-12 mobile-col-centered" id="stopNumber" style="color: #fff"><b>Stop Number: </b>' + this.get("stopid") + ' </div></div> <div class="row"><div class="col-xs-6 mobile-col-centered"><button type="button" class="btn btn-outline-warning" id="setSource" onclick="setValueOnForm(\'' + marker_name + "','" + this.get("stopid") + '\',\'source\')">Set Source</button></div><div class="col-xs-6 mobile-col-centered pl-3"><button type="button" class="btn btn-outline-warning" id="setDest" onclick="getswitch(' + this.get("stopid") + ");setValueOnForm('" + marker_name + "','" + this.get("stopid") + "','destination')\">Set Destination</button></div></div></div><div class='row p - 3 mp - 5'><div class='col - xs mobile - col - centered col - centered'><button type='button' class='btn btn-outline-info' onClick=\"openScheduleforStop(" + '"' + marker_name + '",' + this.get("stopid") + ')" >Open Schedule</button></div></div>';
                        $(content_string).appendTo("#markerwindow-content");
                        this.setOptions({ icon: stop_icon_h });
                    });
                }

            }
        } else {
            if (flag) {
                marker.addListener('mouseover', function () {
                    lasthover = this.getIcon();
                    var marker_name = this.get("name");
                    marker_name = marker_name.replace(/(['"])/g, "\\$1");
                    // alert("Hover Out");
                    content_string = '<div class="iWindow display-5 p-3 mp-5"><div class="row pb-3 mp-5 text-center"><div class="col-xs-12 mobile-col-centered col-centered" id="stopName">' + this.get("name") + '</div></div><div class="row mp-5"><div class="col-xs-6 mobile-col-centered col-centered"><b>Stop Number: </b>' + this.get("stopid") + '</div></div><div class="row p-3 mp-5"><div class="col-xs-6 mobile-col-centered col-centered"><button type="button" class="btn btn-outline-warning disabled" id="setSource" onclick="setValueOnForm(\'' + marker_name + "','" + this.get("stopid") + '\',\'source\')">Set Source</button></div><div class="col-xs-6 mobile-col-centered col-centered pl-3"><button type="button" class="btn btn-outline-warning disabled" id="setDest" onclick="getswitch(' + this.get("stopid") + ");setValueOnForm('" + marker_name + "','" + this.get("stopid") + "','destination')\">Set Destination</button></div></div><div class='row p - 3 mp - 5'><div class='col - xs mobile - col - centered col - centered'><button type='button' class='btn btn-outline-info' onClick=\"openScheduleforStop(" + "'" + marker_name + "'," + this.get("stopid") + ')" >Open Schedule</button></div></div>';
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
                if (__startStop != "") {
                    marker.addListener('mouseover', function () {
                        lasthover = this.getIcon();
                        // alert("Hover Out");
                        var marker_name = this.get("name");
                        marker_name = marker_name.replace(/(['"])/g, "\\$1");
                        content_string = '<div class="iWindow display-5 p-3 mp-5"><div class="row pb-3 mp-5 text-center"><div class="col-xs-12 mobile-col-centered col-centered" id="stopName">' + this.get("name") + '</div></div><div class="row mp-5"><div class="col-xs-6 mobile-col-centered col-centered"><b>Stop Number: </b>' + this.get("stopid") + '</div></div><div class="row p-3 mp-5"><div class="col-xs-6 mobile-col-centered col-centered"><button type="button" class="btn btn-outline-warning" id="setSource" onclick="setValueOnForm(\'' + marker_name + "','" + this.get("stopid") + '\',\'source\')">Set Source</button></div><div class="col-xs-6 mobile-col-centered col-centered pl-3"><button type="button" class="btn btn-outline-warning" id="setDest" onclick="getswitch(' + this.get("stopid") + ");setValueOnForm('" + marker_name + "','" + this.get("stopid") + "','destination')\">Set Destination</button></div></div><div class='row p - 3 mp - 5'><div class='col - xs mobile - col - centered col - centered'><button type='button' class='btn btn-outline-info' onClick=\"openScheduleforStop(" + '\'' + marker_name + '\',' + this.get("stopid") + ')\" >Open Schedule</button></div></div>';

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
                        content_string = '<div class="iWindow display-5 p-3 mp-5"><div class="row pb-3 mp-5 text-center"><div class="col-xs-12 mobile-col-centered col-centered" id="stopName">' + this.get("name") + '</div></div><div class="row mp-5"><div class="col-xs-6 mobile-col-centered col-centered"><b>Stop Number: </b>' + this.get("stopid") + '</div></div><div class="row p-3 mp-5"><div class="col-xs-6 mobile-col-centered col-centered"><button type="button" class="btn btn-outline-warning" id="setSource" onclick="setValueOnForm(\'' + marker_name + "','" + this.get("stopid") + '\',\'source\')">Set Source</button></div><div class="col-xs-6 mobile-col-centered col-centered pl-3"><button type="button" class="btn btn-outline-warning" id="setDest" onclick="getswitch(' + this.get("stopid") + ");setValueOnForm('" + marker_name + "','" + this.get("stopid") + "','destination')\">Set Destination</button></div></div><div class='row p - 3 mp - 5'><div class='col - xs mobile - col - centered col - centered'><button type='button' class='btn btn-outline-info' onClick=\"openScheduleforStop(" + "'" + marker_name + "'," + this.get("stopid") + ')" >Open Schedule</button></div></div>';

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
        }





        markers.push(marker);
        // markerHover(map, marker);

    }

    setMarker(map);
    setMapBounds(stopid);



    // if (stopid=="None" && endstop == "None"){
    //     var markerCluster = new MarkerClusterer(map, markers, {
    //       imagePath: "/static/img/markers/clusterer/m"
    //     });    
    // }
}

function setMapBounds(start) {
    var bounds = new google.maps.LatLngBounds();
    var center_point = "";
    for (var i = 0; i < markers.length; i++) {
        bounds.extend(markers[i].getPosition());
        var icon = markers[i].getIcon();
        //console.log(icon);
        if (icon == "/static/img/markers/StartStop.png") {
            center_point = markers[i];
        }
    }
    if (center_point != "") {
        map.setCenter(center_point);
    } else {
        map.fitBounds(bounds);
    }

    var listener = google.maps.event.addListener(map, "bounds_changed", function () {
        if (map.getZoom() > 16) {
            if (center_point != "") {
                map.setCenter(center_point);
            }
            map.setZoom(16);
        }
        google.maps.event.removeListener(listener);
    });

}
// Set inividual marker on the map
function setMarker(map) {
    for (var i = 0; i < markers.length; i++) {
        markers[i].setMap(map);
    }
}

// Clear the markers from the map
function clearMarkers() {
    setMarker(null);
}

// Function to delete markers from the map
function deleteMarkers(markers) {
    //console.log("Deleting all stops");
    clearMarkers();
    markers = [];
}

function deleteRoute() {
    if (route != "") {
        //Delete the routes
        route.setMap(null);
        return;
    } else {
        return;
    }
}


// The below script deactivates all the destination features on the UI if source is not yet provided
