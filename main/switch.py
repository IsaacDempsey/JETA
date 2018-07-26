from .models import Linked, Stops, Routes
import pandas as pd

# Checks whether start and destination stops are linked by a route or not.
class Switch_start():
    def __init__(self, start_id, destination_id):
        self.start_id = start_id
        self.destination_id = destination_id
        self.routes = Routes.objects.all().values()
        self.linked = Linked.objects.all().values()

    # Returns 0 if start and destination are linked.
    # Else, returns stopid of station with same name which IS linked and should be switched.
    def switch_check(self):
        df1 = pd.DataFrame.from_records(self.linked)
        linked_dict = df1.to_dict('index')
        
        df2 = pd.DataFrame.from_records(self.routes)
        routes_dict = df2.to_dict('index')

        route_stops = []
        for key, value in routes_dict.items():
            for key in value:
                route_stops.append(value['stopids'])

        linked_start = True
        linked = []

        for key, value in linked_dict.items():
            if self.start_id in value['linked']:
                linked.append(value['linked'])
        # linked = [ int(i) for i in linked ]
        for j in route_stops:
            if self.start_id in j:
                mid = j.index(self.start_id)
                slic = j[mid:]
                if self.start_id and self.destination_id in slic:
                    linked_start = False
                    return 0
                    break
                    # Start and destination linked by single route

        if linked_start == True:      
            for k in linked[0]:
                for j in route_stops:
                    if k in j:
                        mid = j.index(k)
                        slic = j[mid:]
                        if self.start_id and self.destination_id in slic:
                            return k
                            break
                            # Start and destination NOT linked, returns new start stop id
