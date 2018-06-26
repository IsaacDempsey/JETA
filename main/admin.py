from django.contrib import admin
from .models import DublinBusStops, DublinRoutes, DublinWeather

# Register your models here.
admin.site.register(DublinBusStops)
admin.site.register(DublinRoutes)
admin.site.register(DublinWeather)
