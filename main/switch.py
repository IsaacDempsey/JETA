from django.forms.models import model_to_dict
from models import Linked, Routes

class Switch_start():
    def __init__(self, start_id, destination_id):
        self.start_id = start_id
        self.destination_id = destination_id
        self.routes_dict = model_to_dict(Routes.objects.all())
        self.linked_dict = model_to_dict(Linked.objects.all())

    def switch_check(self):
        print('Inswitch')
        linked_start = False
        new_start = self.start_id
        linked = []
        for key, value in self.linked_dict.items():
            if self.start_id in value['linked']:
                linked.append(value['linked'])

        for key,value in self.routes_dict.items():
            j = value.tolist()
            if self.start_id in j:
                mid = j.index(self.start_id)
                slic = j[mid:]
                if self.start_id and self.destination_id in slic:
                    return False
                    # Start and destination linked
                else:
                    linked_start = True
                    
        if linked_start == True:      
            for k in linked:
                for key,value in self.routes_dict.items():
                    j = value.tolist()
                    if k in j:
                        mid = j.index(k)
                        slic = j[mid:]
                        if self.start_id and self.destination_id in slic:
                            new_start = k
                            return True, new_start
                            # Start and destination NOT linked, returns new start stop id
