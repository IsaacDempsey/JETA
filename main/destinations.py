import json
from collections import defaultdict
import pandas as pd
from .models import Routes, Linked, Stops

# Shows relevant (can be reached in 1 ride) destination bus stops to start bus stops
class Destinations():
    def __init__(self, start_id):
        self.start_id = start_id
        self.routes = Routes.objects.all().values()
        self.linked = Linked.objects.all().values()
        self.stops = Stops.objects.all().values()

    def destinations_json(self):
        df1 = pd.DataFrame.from_records(self.linked)
        linked_dict = df1.to_dict('index')

        df2 = pd.DataFrame.from_records(self.routes)
        routes_dict = df2.to_dict('index')
        
        df3 = pd.DataFrame.from_records(self.stops)
        df3['stopid'] = df3['stopid'].astype(int)
        df3['lat'] = df3['lat'].astype(float)
        df3['lng'] = df3['lng'].astype(float)

        linked = []
        print(linked)
        for key, value in linked_dict.items():
            if self.start_id in value['linked']:
                linked.append(value['linked'])

        route_stops = []
        for key, value in routes_dict.items():
            for key in value:
                route_stops.append(value['stopids'])
                
        #if linked empty (start bus stop id has no linked stops)
        if not linked:
            final_list = []
            for i in route_stops:
                if self.start_id in i:
                    start = i.index(self.start_id)
                    temp_list = i[start:]
                    final_list.append(temp_list)
        else:
            # this list will be all the bus stops related to the start bus stop
            final_list = []
            for j in linked:
                for i in route_stops:
                    if j in i:
                        start = i.index(j)
                        temp_list = i[start:]
                        final_list.append(temp_list)

        # this list is a list of only unique values from final_list
        single_list = []
        # single list is all bus stops for map plotting on destionation selection
        for i in final_list:
            for j in i:
                if j not in single_list:
                    single_list.append(j)

        # Finally, take single_list of relevant stops and create JSON of all the info needed by Javascript on front end
        j = 0
        json_data = defaultdict(list)
        for i in single_list:
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
    
