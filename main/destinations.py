import pandas as pd
import json
import numpy as np
from collections import defaultdict
from django.forms.models import model_to_dict
from .models import Routes
from .models import Linked
from .models import Stops

class Destinations():
    def __init__(self, start_id):
        self.start_id = start_id
        self.routes_dict = model_to_dict(Routes.objects.all())
        self.linked_dict = model_to_dict(Linked.objects.all())
        self.stops = pd.DataFrame(list(Stops.objects.all().values()))

    def destinations_json(self):
        linked = []
        for key, value in self.linked_dict.items():
            if self.start_id in value['linked']:
                linked.append(value['linked'])
                
        #if linked empty (start bus stop id has no linked stops)
        if not linked:
            final_list = []
            for key,value in self.routes_dict.items():
                i = value.tolist()
                if self.start_id in i:
                    start = i.index(self.start_id)
                    temp_list = i[start:]
                    final_list.append(temp_list)
                    
        # this list will be all the related bus stops to the start bus stop
        else:
            final_list = []
            for j in linked:
                for key,value in self.routes_dict.items():
                    i = value.tolist()
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
            df_each = self.stops.loc[self.stops['stop_id'] == i]
            if df_each.empty:
                continue
            longlat = []
            x = df_each.iloc[0]['stop_lon']
            y = df_each.iloc[0]['stop_lat']
            longlat.append(x)
            longlat.append(y)
            json_data[j].append({'stop_id': str(df_each.iloc[0]['stop_id']), 'stop_name': df_each.iloc[0]['stop_name'], 'coord': longlat})

        json_list = []

        for key, value in json_data.items():
            json_list.append(value[0])
            
        json_front_end = json.dumps(json_list)
        
        return json_front_end
    
