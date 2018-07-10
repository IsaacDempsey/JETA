var localAddress = window.location.protocol // Local url


$('#get_start').on('submit', function(event){
    event.preventDefault();
    console.log("form submitted!")  // sanity check
    start();
});

function start() {
    console.log("start is working!"); // sanity check
    console.log($('#source').val());
    $.ajax({
        url : localAddress + '/main/get_start',
        data : { 
            start_text : $('#source').val() 
            },
        });
};

$.getJSON('/static/json/map_style.json', function(mapstyle) {
    var map = new google.maps.Map(document.getElementById('googleMap'), {
        center: new google.maps.LatLng(53.346834137467795,-6.254525456712543),
        zoom: 12,
        styles: mapstyle
    }); 

    $.getJSON(localAddress + '/main/route_result', function(data2) {
        var coordinates2 = [];
        var names = [];
        for (var i = 0; i < data2.length; i++) {
            var iarr = data2[i];
            coordinates2.push({lat: iarr.coord[1], lng: iarr.coord[0]});
            names.push(iarr.stop_name);   
        }

        infowindow = new google.maps.InfoWindow();
        var stop_icon = {
            path: 'M0,0a8,8 0 1,0 16,0a8,8 0 1,0 -16,0',
            fillColor: '#e6f2ff',
            fillOpacity: 0.8,
            scale: 1,
            strokeColor: '#99ccff',
            strokeWeight: 1
        };

        var stop_icon_h = {
            path: 'M0,0a8,8 0 1,0 16,0a8,8 0 1,0 -16,0',
            fillColor: 'yellow',
            fillOpacity: 0.8,
            scale: 1,
            strokeColor: 'blue',
            strokeWeight: 1
        };

        for (var i = 0; i < coordinates2.length; i++) {
            var stop = coordinates2[i];
            var stop_name = names[i];

            var bus_stop = new google.maps.Marker({
                position: stop,
                icon: stop_icon,
                map: map
            });

            showHideMarker(map, bus_stop, stop_name);
        };

        bus_stop.setMap(map);
        function showHideMarker(map, bus_stop) {
            var infowindow = new google.maps.InfoWindow({
                content: stop_name
            });
                
            bus_stop.addListener('mouseout', function () {
                bus_stop.setOptions({icon: stop_icon});
                infowindow.close(bus_stop.get('map'), bus_stop);
            });

            bus_stop.addListener('mouseover', function () {
                bus_stop.setOptions({icon: stop_icon_h});
                infowindow.open(bus_stop.get('map'), bus_stop);
            });
        };
    });

    $.getJSON('/static/json/routes.json', function(data) {
        var coordinates_arr = [];

        //iterates through each key in json
        $.each(data, function(index, data) {
            var coordinates = [];
            for (var i = 0; i < data.length; i++) {
                var iarr = data[i];
                coordinates.push({lat: iarr[1], lng: iarr[0]});
                if (i == data.length - 1) {
                    coordinates_arr.push(coordinates);
                    coordinates = [];
                };
            };
        });

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
});

var stationsTable = document.getElementById("stationsTable");
var $j = jQuery.noConflict();

$j(function () {
    $j('#datetimepicker1').datetimepicker();
});

$j(function () {
    $j("#source").autocomplete({
        source: localAddress + '/main/get_address',
        minLength: 3,
    });
});

$j(function () {
    $j("#destination").autocomplete({
        source: localAddress + '/main/get_address',
        minLength: 3,
    });
});

