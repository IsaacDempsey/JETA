from django.shortcuts import render
from django.http import JsonResponse

from .models import DublinBusStops


def index(request):
    return render(request, 'index.html')


# Returns first 10 stations in DublinBusStops table as JSON.
def stations(request):
    stations = DublinBusStops.objects.all()[:10].values()
    print(stations)

    stationJson = []
    for i in stations:
        stationJson.append(dict(i))

    return JsonResponse(stationJson, safe=False)
