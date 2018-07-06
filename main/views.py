from django.http import JsonResponse, HttpResponse
from django.shortcuts import render
from django.urls import reverse
from .models import Stops, Linked, Routes

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
            badd_json['label'] = badd.address +" , "+ badd.stopid
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