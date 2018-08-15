from .models import Fares
import pandas as pd
import numpy as np

# Checks how many stages travelled by user
class Faresfinder():
    def __init__(self, start_id, destination_id, line_id):
        self.start_id = start_id
        self.destination_id = destination_id
        self.line_id = line_id
        self.fare_data1 = Fares.objects.filter(route = self.line_id, direction = "I").values()
        self.fare_data2 = Fares.objects.filter(route = self.line_id, direction = "O").values()

    # Returns number of stages traversed
    def stages_finder(self):
        inbound = pd.DataFrame.from_records(self.fare_data1)
        outbound = pd.DataFrame.from_records(self.fare_data2)
        source = self.start_id
        destination = self.destination_id

        journeys_out = outbound.pattern_id.unique()
        journeys_out.tolist()
        journeys_in = inbound.pattern_id.unique()
        journeys_in.tolist()

        route_id_out = None
        route_id_in = None
        stages_travelled = None

        for i in journeys_out:
            temp = outbound['pattern_id'] == i
            tempdf = outbound[temp]
            check_in_s = tempdf['stop'] == source
            check_in_d = tempdf['stop'] == destination
            look1 = tempdf[check_in_s]
            look2 = tempdf[check_in_d]
            if look1.empty == False and look2.empty == False:
                route_id_out = i
        
        for i in journeys_in:
            temp = inbound['pattern_id'] == i
            tempdf = inbound[temp]
            check_in_s = tempdf['stop'] == source
            check_in_d = tempdf['stop'] == destination
            look1 = tempdf[check_in_s]
            look2 = tempdf[check_in_d]
            if look1.empty == False and look2.empty == False:
                route_id_in = i
        
        if route_id_out != None:
            out_filtered = outbound['pattern_id'] == route_id_out
            df_out_filtered = outbound[out_filtered]
            source_out_index = df_out_filtered[df_out_filtered['stop'] == source].index.values.astype(int)[0]
            destination_out_index = df_out_filtered[df_out_filtered['stop'] == destination].index.values.astype(int)[0]
            if destination_out_index > source_out_index:
                stage_out1 = df_out_filtered.loc[df_out_filtered['stop'] == source, 'stage'].iloc[0]
                stage_out2 = df_out_filtered.loc[df_out_filtered['stop'] == destination, 'stage'].iloc[0]
                stages_travelled = stage_out2 - stage_out1
        
        if route_id_in != None:
            in_filtered = inbound['pattern_id'] == route_id_in
            df_in_filtered = inbound[in_filtered]
            source_in_index = df_in_filtered[df_in_filtered['stop'] == source].index.values.astype(int)[0]
            destination_in_index = df_in_filtered[df_in_filtered['stop'] == destination].index.values.astype(int)[0]
            if destination_in_index > source_in_index:
                stage_in1 = df_in_filtered.loc[df_in_filtered['stop'] == source, 'stage'].iloc[0]
                stage_in2 = df_in_filtered.loc[df_in_filtered['stop'] == destination, 'stage'].iloc[0]
                stages_travelled = stage_in2 - stage_in1
        return stages_travelled