from django.db import connection # useful for viewing django sql using print(connection.queries)
from django.db.models import Q
from django.http import JsonResponse, HttpResponse
from django.shortcuts import render
from django.urls import reverse

from .models import Coefficients, Lines, Linked, Routes, Stops, Timetable, Fares
from .destinations import Destinations
from .route_result import Route_result
from .switch import Switch_start
from .fares import Faresfinder

from datetime import datetime, timedelta
import json
from more_itertools import unique_everseen
import pandas as pd
from pytz import timezone
import time

def isfloat(x):
    try:
        float(x)
        return True
    except:
        return False


def index(request):
    return render(request, 'index.html')


def lines(request):
    """
    Arguments: source bus stop, destination bus stop
    Returns json of bus lines which have routes that use these two bus stops.  
    Note: does not check that source stop is before the destination stop.
        - Logically this will always be the case since routes are one way.
    """
    source = request.GET.get('source', '')
    destination = request.GET.get('destination', '')

    # Check that both source and destination are given, and that they are ints.
    if not source.isnumeric() or not destination.isnumeric():
        response = HttpResponse(json.dumps(
            {"error": "Source and destination terms either not numbers or not given."}), content_type='application/json')
        response.status_code = 400
        return response

    routes = Routes.objects.filter(stopids__contains=[source, destination]).values_list('lineid', flat=True)
    lines = list(set(list(routes)))

    return HttpResponse(json.dumps(lines), content_type='application/json')


def journeytime(request):
    """
    Arguments: source & destination bus stops, lineid (e.g. 39A), time (unixtime)
    Returns json showing model prediction:
        - Arrival time at destination
        - Total travel time
        - Travel time for each segment of the journey (distance between each bus stop)
    """

    source = request.GET.get('source', '')
    destination = request.GET.get('destination', '')
    lineid = request.GET.get('lineid')
    start_time = request.GET.get('time', '')
    rain = request.GET.get('rain')

    if isfloat(rain): 
        rain = float(rain)
    else:
        rain = 0.0
        
    if not source.isnumeric() or not destination.isnumeric() or not lineid or not start_time.isnumeric():
        response = HttpResponse(json.dumps(
            {"error": "Missing query term/query term invalid."}), content_type='application/json')
        response.status_code = 400
        return response

    # Get Irish timezone (utc + daylight saving time (DST))
    irish_time = timezone('Europe/Dublin')

    # Get start_time (unixtime) as datetime object
    dt_time = datetime.fromtimestamp(int(start_time), irish_time)

    # Get arrivaltime in seconds
    date = dt_time.date()
    date_unixtime = time.mktime(date.timetuple())
    seconds_since_midnight = int(time.mktime((dt_time - timedelta(seconds = date_unixtime)).timetuple()))

    # List of school holidays
    school_hols = [("2018-08-14","2018-09-02"),("2018-10-29","2018-11-02"),("2018-12-24","2019-01-04"),
    ("2019-02-18","2019-02-22"),("2019-04-15","2019-04-26")]

    # Create flag for school holiday
    school_holiday = 0
    for i in school_hols:
        begin = datetime.strptime(i[0],'%Y-%m-%d')
        end = datetime.strptime(i[1],'%Y-%m-%d')
        if begin.date() <= date <= end.date():
            school_holiday = 1

    # Create list with desired weekday filled.
    week_dummies = [0] * 7
    bank_holiday = False

    # List of bank holidays
    bank_hols = ["2018-10-29","2018-12-25","2018-12-26","2019-01-01","2019-03-17","2019-04-22",
    "2019-05-06","2019-06-03","2019-08-05",]

    # If bank holiday, change day of week to Sunday.
    for i in bank_hols:
        holiday = datetime.strptime(i,'%Y-%m-%d')
        if date == holiday.date():
            week_dummies[6] = 1 # Mon: 0, Sun: 6
            bank_holiday = True

    if bank_holiday == False:
        weekday = date.weekday() # Mon: 0, Sun: 6
        week_dummies[weekday] = 1

    del week_dummies[2] # Delete wednesday - not included in model due to dummy var trap
    
    # Group model inputs into single list
    model_inputs = [seconds_since_midnight, rain, school_holiday] + week_dummies

    # Get stop lists associated with query lineid, start stop and end stop
    routes = Routes.objects.filter(lineid=lineid, stopids__contains=[source, destination]).values()
    routes = pd.DataFrame.from_records(routes)

    if routes.empty:
        response = HttpResponse(json.dumps(
            {"error": "Cannot find data which fits these terms."}), content_type='application/json')
        response.status_code = 400
        return response

    if routes.shape[0] > 1:
        print("Error: multiple possible routes.")
        print(routes)

    # Convert pandas list of stopids to list. If multiple possible routes, take first row.
    stop_list = routes['stopids'].tolist()[0]

    # Slice list by source and destination stop
    journey_stops = stop_list[stop_list.index(int(source)):(stop_list.index(int(destination))+1)]

    # Remove duplicate stops from list, while maintaining stop order.
    journey_stops = list(unique_everseen(journey_stops))

    # Change each stopid into string
    stringified = list(map(str, journey_stops))

    # Make stopids into segments
    journey_segments = [ '_'.join(x) for x in zip(stringified[0:], stringified[1:])]

    # Select coefficient rows with these segment ids, and load into pd dataframe.
    coefficients_qs = Coefficients.objects.filter(pk__in=journey_segments).values()
    coefficients = pd.DataFrame.from_records(coefficients_qs)

    # Sort values by journey_segment segmentid
    coefficients['segment'] = coefficients['segment'].astype("category")
    coefficients['segment'].cat.set_categories(journey_segments, inplace=True)
    coefficients = coefficients.sort_values(["segment"])

    # Rearrange columns and set segment id as index
    coefficients = coefficients[["segment", "intercept", "arrivaltime", "rain", "holiday",
    "mon", "tue", "thu", "fri", "sat", "sun"]]    
    coefficients = coefficients.set_index('segment')

    # Loop through rows of coefficients df, calculating segment travel time
    arrivaltime = model_inputs[0]
    totaltraveltime = 0
    segment_times = []

    for i, rows in coefficients.iterrows():
        traveltime = (rows['intercept']
                    +(rows['arrivaltime']*arrivaltime)
                    +(rows['rain']*model_inputs[1])
                    +(rows['holiday']*model_inputs[2])
                    +(rows['mon']*model_inputs[3])
                    +(rows['tue']*model_inputs[4])
                    +(rows['thu']*model_inputs[5])
                    +(rows['fri']*model_inputs[6])
                    +(rows['sat']*model_inputs[7])
                    +(rows['sun']*model_inputs[8]))
        segment_times.append((i, round(traveltime)))
        totaltraveltime += traveltime

        # arrivaltime = initial start time + sum of previous segment times
        arrivaltime = model_inputs[0] + totaltraveltime

    # Construct json
    json_dict = {}
    json_dict['arrivaltime'] = str(timedelta(seconds=round(int(arrivaltime))))
    json_dict['totaltraveltime'] = str(timedelta(seconds=round(int(totaltraveltime))))
    json_dict['segment_times'] = {i[0]:i[1] for i in segment_times}

    return HttpResponse(json.dumps(json_dict), content_type='application/json')


def get_address(request):
    if not request.is_ajax():
        response = HttpResponse(json.dumps(
            {"error": "Not Ajax Request"}), content_type='application/json')
        response.status_code = 400
        return response

    term = request.GET.get('term', '')
    bus_adds = Stops.objects.filter(
        Q(stopid__startswith=term) | Q(address__icontains=term))[:10]
    results = []
    for badd in bus_adds:
        badd_json = {}
        badd_json['label'] = badd.address +", "+ str(badd.stopid)
        results.append(badd_json)
    data = results

    return HttpResponse(json.dumps(data), content_type='application/json')


def locations(request):
    """
    Query Terms: latitude, longitude and the radius of the distance from the point/line given.
        - Radius given in degrees from given lat/lng. In Dublin, 0.0005 degrees is very roughly 55 meters.
        - Either latitude or longitude or both can be given. 
        - If only lat or lng are given, any bus stop closer than the radius distance all along that line are returned.
    """

    lat = request.GET.get('lat', '')
    lng = request.GET.get('lng', '')
    radius = request.GET.get('radius', '')

    if isfloat(radius):
        r = float(radius)
    else:
        r = 0.0005

    stops_qs = Stops.objects.all()

    if isfloat(lat):
        lat = float(lat)
        stops_qs = stops_qs.filter(lat__gte=(lat-r), lat__lte=(lat+r))

    if isfloat(lng):
        lng = float(lng)
        stops_qs = stops_qs.filter(lng__gte=(lng-r), lng__lte=(lng+r))

    stops = pd.DataFrame.from_records(stops_qs.values())

    if stops.empty:
        response = HttpResponse(json.dumps(
            {"error": "No Data fits the Criteria"}), content_type='application/json')
        response.status_code = 400
        return response

    # Group lat and lng columns into list of form [lng, lat]
    stops = stops.groupby(['stopid', 'address'], as_index=False).apply(
        lambda x: x[['lng', 'lat']].values.tolist()[0])
    stops = pd.DataFrame(stops).reset_index()
    stops = stops.rename(columns={'stopid': 'stop_id', 'address': 'stop_name', 0: 'coord'})

    return HttpResponse(stops.to_json(orient='records'), content_type='application/json')    


def stops(request):
    """
    Query Terms: source stop id, destination stop id, bus line id.
        - source and destination must be ints
        - Either all or none of these terms can be added.
    Returns json showing stop information:
        - If source stopid is given, returns stopids that can be reached from this location.
        - If source & destination stopid are given, returns stopids that connect these two via any route.
        - If source, destination & lineid are given, returns stopids that connect these two via only this route
    Stop information:
        - stop_id
        - stop_name = address of stop
        - lineid = dictionary or form {lineid: order of stop on route}. E.g. {"46A":14,"46E":13,"7B":13}
        - coord = list of coordinations [lng, lat].
    """

    source = request.GET.get('source')
    destination = request.GET.get('destination')
    lineid = request.GET.get('lineid')

    if (source and not source.isnumeric()) or (destination and not destination.isnumeric()):
        response = HttpResponse(json.dumps(
            {"error": "Source/Destination query terms not numeric."}), content_type='application/json')
        response.status_code = 400
        return response
    
    routes_qs = Routes.objects.all()
        
    if source:
        source = int(source)

        # Get linked stops if there are any.
        linked_qs = Linked.objects.filter(linked__contains=[source]).values_list('linked', flat=True)

        try:
            source_stops = list(linked_qs)[0]
        except:
            source_stops = [source]

        routes_qs = routes_qs.filter(stopids__overlap=source_stops)


    if destination:
        destination = int(destination)
        routes_qs = routes_qs.filter(stopids__contains=[destination])

    if lineid:
        routes_qs = routes_qs.filter(lineid=lineid)

    routes = pd.DataFrame.from_records(routes_qs.values('lineid', 'stopids', 'direction'))

    if routes.empty:
        response = HttpResponse(json.dumps(
            {"error": "No Data fits the Criteria"}), content_type='application/json')
        response.status_code = 400
        return response

    # Slice stopids to left of start_stop to remove stops previous to the start stop   
    if source:
        # Because the start stopid could be any of the linked stops, we need to use a function.
        def tryslice(x, source_stops):
            for i in source_stops:
                try:
                    return x[x.index(i):]
                except:
                    continue 

        routes['stopids'] = routes['stopids'].apply(lambda x: tryslice(x, source_stops))
                
    # Slice stopids by destination if it was given.
    if destination:
        routes['stopids'] = routes['stopids'].apply(lambda x: x[:(x.index(destination)+1)])

    # Remove duplicate stopids within routes, while maintaining stop order.
    routes['stopids'] = routes['stopids'].apply(lambda x: list(unique_everseen(x)))

    # Remove routes with identical lineids. Favour routes with more stops.
    routes['stopids_len'] = routes['stopids'].apply(lambda x: len(x))
    routes = routes.sort_values('stopids_len').groupby(['lineid', 'direction']).last()
    routes = pd.DataFrame(routes).reset_index()
    routes = routes[['lineid', 'stopids', 'direction']]
    
    # Unstack stopids column.
    routes_unstacked = routes.set_index(['lineid', 'direction']).stopids.apply(pd.Series).stack().reset_index(level=-1, drop=True).astype(int).reset_index()
    routes_unstacked = routes_unstacked.rename(columns={0:'stopid'})
    
    # Create a column indicating the order (program number) of each stop in each route.
    routes_unstacked['program'] = routes_unstacked.groupby(['lineid', 'direction']).cumcount()

    # Group lineid and program number into column containing a dict for each stopid. E.g. {'84X': 9, '46A': 15 ...}
    routes = routes_unstacked.groupby(['stopid','direction']).apply(lambda x: dict(x[['lineid','program']].values))
    routes = pd.DataFrame(routes).reset_index()
    routes = routes.rename(columns={0: 'lineid'})
    
    # Get set of stops visted by the routes.
    stops_list = list(set(routes['stopid'].tolist()))

    # Get these rows in stops table
    stops = Stops.objects.filter(stopid__in=stops_list).values()
    stops = pd.DataFrame.from_records(stops)

    # Group lat and lng columns into list of form [lng, lat]
    stops = stops.groupby(['stopid', 'address'], as_index=False).apply(
        lambda x: x[['lng', 'lat']].values.tolist()[0])
    stops = pd.DataFrame(stops).reset_index()
    stops = stops.rename(columns={0: 'coord'})

    # Merge stops and routes to combine lineid info with coordinate and address.
    combined_df = pd.merge(stops, routes, on='stopid',sort=False)
    combined_df = combined_df[['stopid', 'address', 'lineid', 'direction','coord']]

    # Rename to suit front end conventions
    combined_df = combined_df.rename(columns={'stopid': 'stop_id', 'address': 'stop_name'})

    return HttpResponse(combined_df.to_json(orient='records'), content_type='application/json')


def get_switch(request):
    print("in switch")
    source = request.GET.get("source")
    destination = request.GET.get("destination")
    source = int(source)
    destination = int(destination)

    switch = Switch_start(source, destination).switch_check()
    switch = int(switch)

    # If switch is 0, the means theres no linked stops, so no switching will happen
    if switch == 0:
        return HttpResponse(source)
    else:
        return HttpResponse(switch)


def get_fares(request):
    source = request.GET.get('source', '')
    destination = request.GET.get('destination', '')
    line_id = request.GET.get('line_id', '')

    if not source.isnumeric() or not destination.isnumeric() or not line_id:
        response = HttpResponse(json.dumps(
            {"error": "No query terms/query terms given invalid."}), content_type='application/json')
        response.status_code = 400
        return response    

    source = int(source)
    destination = int(destination)
    
    stages = Faresfinder(source, destination, line_id).stages_finder()

    return HttpResponse(stages)


def get_timetable(request):
    """This function returns the timetable of a selected stop id"""
    stop = request.GET.get("stopid")
    line = request.GET.get("line")

    timetable_qs = Timetable.objects.all()
    
    if stop:
        stop = int(stop)
        timetable_qs = timetable_qs.filter(stopid=stop)
    
    if line:
        timetable_qs = timetable_qs.filter(lineid=line)
    
    timetable = pd.DataFrame.from_records(timetable_qs.values())
    
    if timetable.empty:
        response = HttpResponse(json.dumps(
            {"error": "No Data fits the Criteria"}), content_type='application/json')
        response.status_code = 400
        return response
    
    return HttpResponse(timetable.to_json(orient='records'), content_type='application/json')

