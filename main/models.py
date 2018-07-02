#This file is used to build the table structure in the database

# DJANGO MODEL IMPORTS
from django.db import models
from django.contrib.postgres.fields import ArrayField

class Routes(models.Model):
    routeid = models.CharField(max_length=10, primary_key=True)
    direction = models.IntegerField(null=True)
    stopids = ArrayField(models.IntegerField(null=True))

    def __str__(self):
        return "Route ID: "+self.routeid
    
    class Meta:
        verbose_name_plural = "Routes"
        indexes = [
            models.Index(fields=['routeid'],)
        ]

class Lines(models.Model):
    lineid = models.CharField(max_length=10, primary_key=True)
    routes = ArrayField(models.CharField(max_length=10))

    def __str__(self):
        return "Line ID: "+self.lineid
    
    class Meta:
        verbose_name_plural = "Lines"
        indexes = [
            models.Index(fields=['lineid'],)
        ]

class Stops(models.Model):
    stopid = models.CharField(max_length=10, primary_key=True)
    address = models.TextField()
    lat = models.DecimalField(max_digits=10, decimal_places=8)
    lng = models.DecimalField(max_digits=10, decimal_places=8)
    routes = ArrayField(models.CharField(max_length=10))
    operator = models.CharField(max_length=10)

    def __str__(self):
        return "STOP: "+self.stopid+" OP: "+self.operator

    class Meta:
        verbose_name_plural = "Stops" 
        indexes = [
            models.Index(fields=['stopid'],)
        ]

# class Timetables(models.Model):
#     stopid = models.CharField(max_length=10)
#     dayofweek = models.CharField(max_length=10)
#     times = ArrayField(models.CharField(max_length=10))

class JourneyLogs(models.Model):
    routeid = models.CharField(max_length=10, primary_key=True)
    segments = ArrayField(models.CharField(max_length=15))
    seg_num = ArrayField(models.IntegerField(null=True))

    def __str__(self):
        return self.routeid

    class Meta:
        verbose_name_plural = "Journey Logs"
        indexes = [
            models.Index(fields=['routeid'],)
        ]    


class Weather(models.Model):
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
