// LOCAL ADDRESS TO BE DYNAMIC
var localAddress = window.location.protocol // Local url
var stationsTable = document.getElementById("stationsTable");
var $j = jQuery.noConflict(); // No conflict with the major jquery for autocomplete widget

var __startStop;
var __endStop;
// Autocomplete Feature when the user enters in the source address
$j(function () {
    // Check for the HTML DOM element who has #source as the id
    $j("#source").autocomplete({
        // Send a ajax request to the below address
        source: localAddress + '/main/get_address',
        // Start autocompleting when the user enter's atleast 2 characters
        minLength: 2,
        contentType: "application/json;charset=utf-8",
        dataType: "json",
        // When the user selects the required input ...-->
        select: function (e, ui) {
            // Get the stop id for the start
            var start = ui.item.label;
            var stopId = start.split(",");
            var startStop = stopId[stopId.length - 1];
            startStop = startStop.trim();
            // ..--> Send an ajax query to the api at the below URL
            $.ajax({
                url: localAddress + "/main/get_start",
                // Set the start text as the label value
                data: { start_text: ui.item.label },
                contentType: "application/json;charset=utf-8",
                dataType: "json",
                // On success send this data to the receive data function
                success: function (data) {
                    // Create a json input for destinations only to select data from the returned filter
                    var autocomplete_data = [];
                    for (var i = 0; i < data.length; i++) {
                        if (data[i].stop_id == startStop){
                            continue;
                        } else {
                            autocomplete_data.push({ label: data[i].stop_name + ", " + data[i].stop_id });
                        }
                    }
                    if (autocomplete_data == []){
                        autocomplete_data.push({ label: "No Destination for this source found" });
                    }
                    // before any new markers are set delete the old ones and then set the new ones
                    deleteMarkers(markers);
                    setMarkers(data, startStop);
                    // refresh autocomplete for destination
                    var endstop;
                    $j("#destination").autocomplete({
                        source: autocomplete_data,
                        minLength: 2,
                        select: function (e,ui) {
                            var end = ui.item.label;
                            var stopId = end.split(",");
                            var endStop = stopId[stopId.length - 1];
                            endStop = endStop.trim();
                            var endData = [];
                            deleteMarkers(markers);
                            for (var i = 0; i<data.length;i++){
                                if (data[i].stop_id == endStop){
                                    endData.push(data[i]);
                                    break;
                                }else{
                                    endData.push(data[i]);
                                }
                            }
                            // Send only data from stop till to stop
                            if (endData == []){
                                setMarkers(data, startStop, endStop);
                            }else{
                                setMarkers(endData, startStop, endStop);
                            }
                            getLines(startStop, endStop);                            
                        }
                    });
                    
                }
            });
        }
    });
});



// On Document Ready
$(document).ready(function () {
    // When the document loads
    let today = moment().format("YYYY-MM-DDTHH:mm");
    document.querySelector("#datetime").value = today;
    $("#lineholder").hide();
    $("#journeyholder").hide();
    loadMap();
});

// Separate Function to render the map
function loadMap() {
    $.getJSON('/static/json/map_style.json', function (mapstyle) {
        var map = new google.maps.Map(document.getElementById("map"), {
          center: new google.maps.LatLng(
            53.346834137467795,
            -6.254525456712543
          ),
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
        setGlobalMap(map);
    });
}

// Creating a Global Map Object
var map;
function setGlobalMap(Asyncmap) {
    map = Asyncmap;
}

// Function to automatically load markers on the map
var markers = [];
function setMarkers(data, stopid, endstop="None"){
    var coordinates = [];
    var names = [];
    var bus_stop;
    if (bus_stop && bus_stop.setMap) {
        bus_stop.setMap(null);
    }
    infowindow = new google.maps.InfoWindow();
    if (data.length<=25){
        map.setZoom(15)
    } else {
        map.setZoom(13);
    }
    for (var i = 0; i < data.length; i++) {
        var stop = { lat: data[i].coord[1], lng: data[i].coord[0] };
        var stop_name = data[i].stop_name;
        var start_icon = "/static/img/StartStop.png";
        var end_icon = "/static/img/EndStop.png";
        if (data[i].stop_id == stopid) {
            // var stop_icon = { path: "M0,0a8,8 0 1,0 20,0a8,8 0 1,0 -20,0", fillColor: "#81C784", fillOpacity: 0.8, scale: 1, strokeColor: "#99ccff", strokeWeight: 4 };
            var stop_icon = start_icon;
            map.setCenter(stop);

        } else if (data[i].stop_id == endstop) {
                // var stop_icon = { path: "M0,0a8,8 0 1,0 16,0a8,8 0 1,0 -16,0", fillColor: "#ef5350", fillOpacity: 0.8, scale: 1, strokeColor: "#99ccff", strokeWeight: 4 };
            var stop_icon = end_icon;
            map.setCenter(stop);
        }else{
            // var stop_icon = { path: "M0,0a8,8 0 1,0 16,0a8,8 0 1,0 -16,0", fillColor: "#e6f2ff", fillOpacity: 0.8, scale: 1, strokeColor: "#99ccff", strokeWeight: 4 };
            var stop_icon = "/static/img/InterStop.png";
        }
        bus_stop = new google.maps.Marker({
            position: stop,
            icon: stop_icon,
            map: map

        });
        markers.push(bus_stop);
        bus_stop.setMap(map);
        showHideMarker(map, bus_stop, stop_name, data[i].stop_id);
    }    
    function showHideMarker(map, bus_stop, stop_name, start_icon) {
        var stop_icon_h = "/static/img/HoverStop.png";
        var infowindow = new google.maps.InfoWindow({
          content: stop_name + ", " + data[i].stop_id,
        });
        var lasthover;
        bus_stop.addListener('mouseout', function () {
            // alert("Hover In");            
            bus_stop.setOptions({ icon: lasthover });
            infowindow.close(bus_stop.get('map'), bus_stop);
        });

        bus_stop.addListener('mouseover', function () {
            lasthover = bus_stop.getIcon();
            // alert("Hover Out");
            bus_stop.setOptions({ icon: stop_icon_h });
            infowindow.open(bus_stop.get('map'), bus_stop);
        });
    };
    //  var markerCluster = new MarkerClusterer(map, markers,
    //         {imagePath: 'https://developers.google.com/maps/documentation/javascript/examples/markerclusterer/m'});
}

// Function to delete markers from the map
function deleteMarkers(markers){
    if (markers.length > 0) {
        for (var i = 0; i <= markers.length - 1; i++) {
            markers[i].setMap(null);
            delete markers[i];
        }
        markers = [];
    }
}

function getLines(startStop, endStop){
    __startStop = startStop;
    __endStop = endStop;
    $.ajax({
      url: localAddress + "/main/lines",
      data: {
        source: startStop,
        destination: endStop,
      },
      contentType: "application/json;charset=utf-8",
      dataType: "json",
      success: function (data) {
          $("#lineholder").show();
          $("#linecontent").html('');
          for (var i = 0; i < data.length; i ++){
              $('<div class= "col-sm-* mr-1 btn btn-info" id="lineid" onclick=getTravelTime(this)>' + data[i] + "</div>").appendTo("#linecontent");
          }
      }
    });
}
function getTravelTime(content) {
    console.log($("#datetime").val());
    var datetime = (moment($("#datetime").val(), "YYYY-MM-DDTHH:mm").valueOf())/1000;
    console.log(__startStop);
    console.log(__endStop);
    console.log(content.innerHTML);
    console.log(datetime);
    $.ajax({
        url: localAddress + "/main/journeytime",
        data: {
            source: __startStop,
            destination: __endStop,
            lineid: content.innerHTML,
            time: datetime,
        },
        contentType: "application/json;charset=utf-8",
        dataType: "json",
        success: function (data) {
            $("#journeyholder").show();
            $("#journeycontent").html("");
            $('<div class= "col-sm-6 text-center">Route: </div><div class= "col-sm-6 text-center"><b>' + content.innerHTML + "</b> </div>").appendTo("#journeycontent");
            $('<div class= "col-sm-6 text-center">Journey Time: </div><div class= "col-sm-6 text-center"><b>' + data.totaltraveltime + "</b> </div>").appendTo("#journeycontent");
            $('<div class= "col-sm-6 text-center">Arrival Time: </div><div class= "col-sm-6 text-center"><b>' + data.arrivaltime + "</b> </div>").appendTo("#journeycontent");
        }
    });

    
}
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

