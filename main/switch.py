from .models import Linked, Stops, Routes
import pandas as pd

class Switch_start():
    def __init__(self, start_id, destination_id):
        self.start_id = start_id
        self.destination_id = destination_id
        self.routes = Routes.objects.all().values()
        self.linked = Linked.objects.all().values()

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
            if str(self.start_id) in value['linked']:
                linked.append(value['linked'])
        linked = [ int(i) for i in linked ]

        for j in route_stops:
            if self.start_id in j:
                mid = j.index(self.start_id)
                slic = j[mid:]
                if self.start_id and self.destination_id in slic:
                    linked_start = False
                    return False
                    break
                    # Start and destination linked by single route

        if linked_start == True:      
            for k in linked:
                for j in route_stops:
                    if k in j:
                        mid = j.index(k)
                        slic = j[mid:]
                        if self.start_id and self.destination_id in slic:
                            return True, k
                            break
                            # Start and destination NOT linked, returns new start stop id
