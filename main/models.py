#This file is used to build the table structure in the database

# DJANGO MODEL IMPORTS
from django.db import models
from django.contrib.postgres.fields import ArrayField

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