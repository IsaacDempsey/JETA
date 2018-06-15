from django.db import models
from django.db.models import CharField
from django.contrib.postgres.fields import ArrayField

# Create your models here.
class Leavetimes(models.Model):
    datasource = CharField(max_length=200)
    dayofservice = CharField(max_length=200)
    trip = CharField(max_length=200)
    tripid = CharField(max_length=200)
    progrnumber = CharField(max_length=200)
    stoppointid = CharField(max_length=200)
    plannedtime_arr = CharField(max_length=200)
    plannedtime_dep = CharField(max_length=200)
    actualtime_arr = CharField(max_length=200)
    actualtime_dep = CharField(max_length=200)
    vehicleid = CharField(max_length=200)
    passengers = CharField(max_length=200)
    passengersin = CharField(max_length=200)
    passengersout = CharField(max_length=200)
    distance = CharField(max_length=200)
    suppressed = CharField(max_length=200)
    justificationid = CharField(max_length=200)
    lastupdate = CharField(max_length=200)
    note = CharField(max_length=200)

class Trips(models.Model):
    datasource = CharField(max_length=200)
    dayofservice = CharField(max_length=200)
    tripid = CharField(max_length=200)
    lineid = CharField(max_length=200)
    routeid = CharField(max_length=200)
    direction = CharField(max_length=200)
    plannedtime_arr = CharField(max_length=200)
    plannedtime_dep = CharField(max_length=200)
    actualtime_arr = CharField(max_length=200)
    actualtime_dep = CharField(max_length=200)
    basin = CharField(max_length=200)
    tenderlot = CharField(max_length=200)
    suppressed = CharField(max_length=200)
    justificationid = CharField(max_length=200)
    lastupdate = CharField(max_length=200)
    note = CharField(max_length=200)

class DublinBusStops(models.Model):
    stopid = CharField(max_length=200)
    loadtime = CharField(max_length=200)
    busstopname = CharField(max_length=200)
    lat = models.DecimalField(max_digits=10, decimal_places=8)
    lng = models.DecimalField(max_digits=10, decimal_places=8)
    lud = CharField(max_length=200)
    routes = ArrayField(CharField(max_length=200))
    flag = CharField(max_length=200)
