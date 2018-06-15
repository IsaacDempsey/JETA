from django.contrib import admin
from .models import Leavetimes, Trips, DublinBusStops

# Register your models here.
admin.site.register(Leavetimes)
admin.site.register(Trips)
admin.site.register(DublinBusStops)