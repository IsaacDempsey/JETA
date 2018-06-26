var localAddress = window.location.protocol // Local url

// Function to get station data and load it into div.
function showStations() {
	var stationsTable = document.getElementById("stationsTable")
	$.getJSON(localAddress + "/stations", null, function (results) {
        var tableRows;
        for(var i = 0; i < results.length; i++) {
            station = results[i];
            tableRows += "<tr>";
            tableRows += "<td>"+station.id+"</td>";
            tableRows += "<td>"+station.stopid+"</td>";
            tableRows += "<td>"+station.busstopname+"</td>";
            tableRows += "</tr>";
            stationsTable.innerHTML += tableRows;
        }
	});
}