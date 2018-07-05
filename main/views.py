from django.shortcuts import render
from django.http import JsonResponse, HttpResponse
import json
from django.urls import reverse
from .models import Stops
import pandas as pd


def index(request):
    return render(request, 'index.html')

# Returns first 10 stations in Stops table as JSON.
def stations(request):
    stations = Stations.objects.all()[:10].values()
    print(stations)

    stationJson = []
    for i in stations:
        stationJson.append(dict(i))

    return JsonResponse(stationJson, safe=False)

def stops(request):
    stops = pd.DataFrame(list(Stops.objects.all()[:10].values()))
    
    return stops.to_json(orient='split')


def get_address(request):
    if request.is_ajax():
        q = request.GET.get('term', '')
        badds = Stops.objects.filter(address__icontains=q)[:20]
        results = []
        for badd in badds:
            badd_json = {}
            badd_json['label'] = badd.address +" , "+ badd.stopid
            results.append(badd_json)
        data = json.dumps(results)
    else:
        data = 'fail'
    mimetype = 'application/json'
    return HttpResponse(data, mimetype)
