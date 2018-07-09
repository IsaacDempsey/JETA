from django.http import JsonResponse, HttpResponse
from django.shortcuts import render
from django.urls import reverse
from .models import Stops, Linked, Routes
from .destinations import Destinations
from .route_result import Route_result

import json
import pandas as pd

def index(request):
    return render(request, 'index.html')

def stops(request):
    stops = Stops.objects.all()[:10].values()

    stops_df = pd.DataFrame.from_records(stops, index='stopid')

    # Test that stop df contains data in server terminal.
    print(stops_df.head(5))

    return HttpResponse(stops_df.to_json(orient='index'), content_type='application/json')


    # Alternative code - building json from list of dicts.

    # stopsJson = []
    # for i in stops:
    #     stopsJson.append(dict(i))

    # return JsonResponse(stopsJson, safe=False)


def get_address(request):
    if request.is_ajax():
        q = request.GET.get('term', '')
        badds = Stops.objects.filter(address__icontains=q)[:20]
        results = []
        for badd in badds:
            badd_json = {}
            badd_json['label'] = badd.address +", "+ badd.stopid
            results.append(badd_json)
        data = json.dumps(results)
    else:
        data = 'fail'
    mimetype = 'application/json'
    return HttpResponse(data, mimetype)

def routes(request):
    routes = Routes.objects.all().values()

    routesJson = []
    for i in routes:
        routesJson.append(dict(i))

    return JsonResponse(routesJson, safe=False)

def linked(request):
    linked = Linked.objects.all().values()

    linkedJson = []
    for i in linked:
        linkedJson.append(dict(i))

    return JsonResponse(linkedJson, safe=False)

def destinations(request):
    start = 15
    dest1 = Destinations(start).destinations_json()
    return JsonResponse(dest1, safe=False)

def route_result(request):
    start = 1165
    destination = 7564
    route1 = Route_result(start, destination).route_json()
    return JsonResponse(route1, safe=False)

def get_start(request):
    print("In GET START")
    print(request)
    if request.is_ajax():
        start_text = request.GET.get("start_text",'')
        print("START REQUEST:",start_text)
        start_split = start_text.split(",")
        id_space = start_split[-1]
        id = id_space.replace(" ", "")
        dest = Destinations(id).destinations_json()
    else:
        start_text = request.GET.get('start_text','')
        print("START REQUEST:",start_text)
        start_split = start_text.split(",")
        print("SPLIT FILES: ",start_split)
        id_space = start_split[-1]
        start_id = id_space.replace(" ", "")
        dest = Destinations(int(start_id)).destinations_json()
    return JsonResponse(dest, safe=False)