from django.db import connection
from django.http import JsonResponse, HttpResponse
from django.shortcuts import render
from django.urls import reverse
from .models import Stops, Linked, Routes, Coefficients
from .destinations import Destinations
from .route_result import Route_result

import json
import pandas as pd

import time
from datetime import datetime, timedelta
from pytz import timezone

def index(request):
    return render(request, 'index.html')

def stops(request):
    stops = Stops.objects.all()[:10].values()
    stops_df = pd.DataFrame.from_records(stops, index='stopid')
    return HttpResponse(stops_df.to_json(orient='index'), content_type='application/json')


def journeytime(request):
    source = request.GET.get('source', '')
    destination = request.GET.get('destination', '')
    lineid = request.GET.get('lineid', '')
    start_time = request.GET.get('time', '')

    rain = 0.5 # Should come from table or API query

    # Get Irish timezone (utc + daylight saving time (DST))
    irish_time = timezone('Europe/Dublin')

    # Get start_time (unixtime) as datetime object
    dt_time = datetime.fromtimestamp(int(start_time), irish_time)

    # Create list with desired weekday filled.
    weekday = dt_time.weekday() # Mon: 0, Sun: 6
    week_dummies = [0] * 7
    week_dummies[weekday] = 1
    del week_dummies[2] # Delete wednesday - not included in model due to dummy var trap

    # Get arrivaltime in seconds
    date = dt_time.date()
    date_unixtime = time.mktime(date.timetuple())
    seconds_since_midnight = int(time.mktime((dt_time - timedelta(seconds = date_unixtime)).timetuple()))
    
    # Group model inputs into single list
    model_inputs = [seconds_since_midnight, rain] + week_dummies

    # Get stop lists associated with query lineid, start stop and end stop
    cursor = connection.cursor()
    sql = """
    SELECT * 
    FROM main_routes 
    WHERE routeid IN (
        SELECT UNNEST(routes) 
        FROM main_lines 
        WHERE main_lines.lineid = %s
    ) 
    AND %s = ANY(main_routes.stopids) 
    AND %s = ANY(main_routes.stopids);
    """
    routes = pd.read_sql(sql, connection, params=[lineid, source, destination])

    if routes.shape[0] > 1:
        print("Error: multiple possible routes.")
        print(routes)

    # Convert pandas list of stopids to list. If multiple possible routes, take first row.
    stop_list = routes['stopids'].tolist()[0]

    # Slice list by source and destination stop
    journey_stops = stop_list[stop_list.index(int(source)):(stop_list.index(int(destination))+1)]

    # Change each stopid into string
    stringified = list(map(str, journey_stops))

    # Make stopids into segments
    journey_segments = [ '_'.join(x) for x in zip(stringified[0:], stringified[1:])]

    # Select coefficient rows with these segment ids
    coefficients_qs = Coefficients.objects.filter(pk__in=journey_segments).values()

    # Load queryset into pd dataframe
    coefficients = pd.DataFrame.from_records(coefficients_qs)

    # Sort values by journey_segment segmentid
    coefficients['segment'] = coefficients['segment'].astype("category")
    coefficients['segment'].cat.set_categories(journey_segments, inplace=True)
    coefficients = coefficients.sort_values(["segment"])

    # Rearrange columns and set segment id as index
    coefficients = coefficients[["segment", "intercept", "arrivaltime", "rain", 
    "dayofweek_Monday", "dayofweek_Tuesday", "dayofweek_Thursday", 
    "dayofweek_Friday", "dayofweek_Saturday", "dayofweek_Sunday"]]    
    coefficients = coefficients.set_index('segment')

    # Loop through rows of coefficients df, calculating segment travel time
    arrivaltime = model_inputs[0]
    totaltraveltime = 0
    segment_times = []

    for i, rows in coefficients.iterrows():
        traveltime = (rows['intercept']
                    +(rows['arrivaltime']*arrivaltime)
                    +(rows['rain']*model_inputs[1])
                    +(rows['dayofweek_Monday']*model_inputs[2])
                    +(rows['dayofweek_Tuesday']*model_inputs[3])
                    +(rows['dayofweek_Thursday']*model_inputs[4])
                    +(rows['dayofweek_Friday']*model_inputs[5])
                    +(rows['dayofweek_Saturday']*model_inputs[6])
                    +(rows['dayofweek_Sunday']*model_inputs[7]))
        segment_times.append((i, round(traveltime)))
        totaltraveltime += traveltime

        # arrivaltime = initial start time + sum of previous segment times
        arrivaltime = model_inputs[0] + totaltraveltime

    # Construct json
    json_dict = {}
    json_dict['arrivaltime'] = round(arrivaltime)
    json_dict['totaltraveltime'] = round(totaltraveltime)
    json_dict['segment_times'] = {i[0]:i[1] for i in segment_times}

    return HttpResponse(json.dumps(json_dict), content_type='application/json')


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

    return HttpResponse(data, content_type='application/json')

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