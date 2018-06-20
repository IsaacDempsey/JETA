from django.db import models
from django.contrib.postgres.fields import ArrayField

# Create your models here.
# class Leavetimes(models.Model):
#     id = models.AutoField(primary_key=True)
#     datasource = models.CharField(max_length=2, null=True)
#     dayofservice = models.DateTimeField(null=True)
#     tripid = models.IntegerField(null=False)
#     progrnumber = models.SmallIntegerField(null=True)
#     stoppointid = models.IntegerField(null=False)
#     plannedtime_arr = models.IntegerField(null=True)
#     plannedtime_dep = models.IntegerField(null=True)
#     actualtime_arr = models.IntegerField(null=True)
#     actualtime_dep = models.IntegerField(null=True)
#     vehicleid = models.IntegerField(null=True)
#     passengers = models.CharField(max_length=1, null=True)
#     passengersin = models.CharField(max_length=1, null=True)
#     passengersout = models.CharField(max_length=1, null=True)
#     distance = models.CharField(max_length=1, null=True)
#     suppressed = models.CharField(max_length=1, null=True)
#     justificationid = models.BigIntegerField(null=True)
#     lastupdate = models.DateTimeField(null=True)
#     note = models.CharField(max_length=20j,null=True)

#     def __str__(self):
#         return "TRIP: "+self.tripid+" STOP NUMBER: "+self.stoppointid+" STOP OFFSET NUMBER: "+self.progrnumber

#     class Meta:
#         verbose_name_plural = "Leavetimes"
#         indexes = [
#             models.Index(fields=['tripid',]),
#             models.Index(fields=['stoppointid', ]),
#             models.Index(fields=['tripid', 'stoppointid',]),
#         ]


# class Trips(models.Model):
#     id = models.AutoField(primary_key=True)
#     datasource = models.CharField(max_length=2, null=True)
#     dayofservice = models.DateTimeField(null=True)
#     tripid = models.IntegerField(null=True)
#     lineid = models.CharField(max_length=5, null=True)
#     routeid = models.CharField(max_length=8, null=True)
#     direction = models.PositiveSmallIntegerField(null=True)
#     plannedtime_arr = models.IntegerField(null=True)
#     plannedtime_dep = models.IntegerField(null=True)
#     actualtime_arr = models.IntegerField(null=True)
#     actualtime_dep = models.IntegerField(null=True)
#     basin = models.CharField(max_length=6, null=True)
#     tenderlot = models.CharField(max_length=5, null=True)
#     suppressed = models.CharField(max_length=5, null=True)
#     justificationid = models.BigIntegerField(null=True)
#     lastupdate = models.DateTimeField(null=True)
#     note = models.TextField(null=True)

#     def __str__(self):
#         return "TRIP: "+self.tripid+" LINE: "+self.lineid+" DIRECTION: "+se;f.direction+"::"+self.dayofservice

#     class Meta:
#         verbose_name_plural = "Trips"
#         indexes = [
#             models.Index(fields=['tripid'],),
#             models.Index(fields=['lineid'],),
#             models.Index(fields=['lineid','direction'],),
#         ]


class DublinBusStops(models.Model):
    stopid = models.CharField(max_length=10)
    loadtime = models.DateTimeField(null=True)
    busstopname = models.TextField()
    lat = models.DecimalField(max_digits=10, decimal_places=8)
    lng = models.DecimalField(max_digits=10, decimal_places=8)
    lud = models.DateTimeField(null=True)
    routes = ArrayField(models.CharField(max_length=10))
    operator = models.CharField(max_length=10)

    def __str__(self):
        return "STOP: "+self.stopid+" OP: "+self.operator

    class Meta:
        verbose_name_plural = "Dublin Bus Stops"

class DublinRoutes(models.Model):
    id = models.AutoField(primary_key=True)
    operator=models.CharField(max_length=5)
    routeId=models.CharField(max_length=10)

    def __str__(self):
        return "OPERATOR: "+self.operator+" ROUTE: "+self.routeId
    
    class Meta:
        verbose_name_plural = "Dublin TFI Routes"

class DublinWeather(models.Model):
    date = models.CharField(max_length=12)
    time = models.CharField(max_length=5, null=True)
    irain = models.IntegerField(null=True)
    rain = models.CharField(max_length=10,null=True)
    itemp = models.IntegerField(null=True)
    temp = models.CharField(max_length=10,null=True)
    iwetb = models.IntegerField(null=True)
    wetb = models.CharField(max_length=10,null=True)
    dewpt = models.CharField(max_length=10,null=True)
    vappr = models.CharField(max_length=10,null=True)
    rhum = models.CharField(max_length=10,null=True)
    msl = models.CharField(max_length=10,null=True)

    def __str__(self):
        return self.date

    class Meta:
        verbose_name_plural = "Weather"
        indexes = [
            models.Index(fields=['rain'],),
            models.Index(fields=['date'],),
            models.Index(fields=['time'],),
            models.Index(fields=['date','time'],),
        ]

class BankHolidays(models.Model):
    day = models.CharField(max_length=10)
    date = models.CharField(max_length=15)
    holiday = models.TextField()

    def __str__(self):
        return "Date: "+self.date+" Day: "+self.day
    
    class Meta:
        verbose_name_plural = "Bank Holidays"