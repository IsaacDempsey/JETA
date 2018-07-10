import json
import numpy as np
from collections import defaultdict
import pandas as pd
from .models import Routes, Stops
from .switch import Switch_start

# Gives json containing all bus stops between start and stop
class Route_result():
    def __init__(self, start_id, destination_id):
        self.start_id = start_id
        self.destination_id = destination_id
        self.routes = Routes.objects.all().values()
        self.stops = Stops.objects.all().values()

    def route_json(self):
        # Returns True if start and destination are not linked by a route.
        switch = Switch_start(self.start_id, self.destination_id).switch_check()
        if switch == True:
            self.start_id = switch[1]
            print("Start switched!")
        
        df2 = pd.DataFrame.from_records(self.routes)
        routes_dict = df2.to_dict('index')
        df3 = pd.DataFrame.from_records(self.stops)
        df3['stopid'] = df3['stopid'].astype(int)
        df3['lat'] = df3['lat'].astype(float)
        df3['lng'] = df3['lng'].astype(float)

        route_stops = []
        for key, value in routes_dict.items():
            for key in value:
                route_stops.append(value['stopids'])
                
        final_list = []
        for i in route_stops:
            if self.start_id in i and self.destination_id in i:
                start = i.index(self.start_id)
                finish = i.index(self.destination_id)
                final_list = i[start:finish]
                break

        # this list is a list of only unique values from final_list
        # single_list = []
        # # single list is all bus stops for map plotting on destionation selection
        # for i in final_list:
        #     for j in i:
        #         if j not in single_list:
        #             single_list.append(j)

        # Finally, take single_list of relevant stops and create JSON of all the info needed by Javascript on front end
        j = 0
        json_data = defaultdict(list)
        for i in final_list:
            j+=1
            df_each = df3.loc[df3['stopid'] == i]
            if df_each.empty:
                continue
            longlat = []
            x = df_each.iloc[0]['lng']
            y = df_each.iloc[0]['lat']
            longlat.append(x)
            longlat.append(y)
            json_data[j].append({'stop_id': str(df_each.iloc[0]['stopid']), 'stop_name': df_each.iloc[0]['address'], 'coord': longlat})

        json_list = []

        for key, value in json_data.items():
            json_list.append(value[0])

        return json_list
    
