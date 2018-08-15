from django.db import models
from django.contrib.postgres.fields import ArrayField


class BankHolidays(models.Model):
    day = models.CharField(max_length=10)
    date = models.CharField(max_length=15)
    holiday = models.TextField()

    def __str__(self):
        return "Date: "+self.date+" Day: "+self.day
    
    class Meta:
        verbose_name_plural = "Bank Holidays"


class Coefficients(models.Model):
    segment = models.CharField(max_length=10, primary_key=True)
    intercept = models.FloatField(null=True)
    arrivaltime = models.FloatField(null=True)
    rain = models.FloatField(null=True)
    holiday = models.FloatField(null=True)
    fri = models.FloatField(null=True)
    mon = models.FloatField(null=True)
    sat = models.FloatField(null=True)
    sun = models.FloatField(null=True)
    thu = models.FloatField(null=True)
    tue = models.FloatField(null=True)

    def __str__(self):
        return "Segment: "+self.segment

    class Meta:
        verbose_name_plural = "Coefficients" 
        indexes = [
            models.Index(fields=['segment'])
        ]

class Fares(models.Model):
    index = models.IntegerField(null=True)
    stop = models.CharField(max_length=10)
    route = models.CharField(max_length=20)
    direction = models.CharField(max_length=10)
    stage = models.FloatField(null=True)
    pattern_id = models.CharField(max_length=10)
    seq = models.IntegerField(null=True)

    def __str__(self):
        return self.stop
    
    class Meta:
        verbose_name_plural = "Linked Stops"
        indexes = [
            models.Index(fields=['index']),
            models.Index(fields=['stop']),
            models.Index(fields=['route']),
            models.Index(fields=['direction']),
            models.Index(fields=['stage']),
            models.Index(fields=['pattern_id']),
            models.Index(fields=['seq']),
        ]  


class Lines(models.Model):
    lineid = models.CharField(max_length=10, primary_key=True)
    routes = ArrayField(models.CharField(max_length=10))

    def __str__(self):
        return "Line ID: "+self.lineid
    
    class Meta:
        verbose_name_plural = "Lines"
        indexes = [
            models.Index(fields=['lineid'])
        ]


class Linked(models.Model):
    stop_name = models.TextField(null=True)
    linked = ArrayField(models.IntegerField(null=True))
    
    def __str__(self):
        return self.stop_name
    
    class Meta:
        verbose_name_plural = "Linked Stops"
        indexes = [
            models.Index(fields=['stop_name']),
            models.Index(fields=['linked']),
        ]


class Routes(models.Model):
    routeid = models.CharField(max_length=10, primary_key=True)
    lineid = models.CharField(max_length=5, null=True)
    direction = models.IntegerField(null=True)
    stopids = ArrayField(models.IntegerField(null=True))

    def __str__(self):
        return "Route ID: "+self.routeid
    
    class Meta:
        verbose_name_plural = "Routes"
        indexes = [
            models.Index(fields=['routeid'])
        ]


class Stops(models.Model):
    stopid = models.IntegerField(primary_key=True)
    address = models.TextField()
    lat = models.DecimalField(max_digits=10, decimal_places=8)
    lng = models.DecimalField(max_digits=10, decimal_places=8)
    lines = ArrayField(models.CharField(max_length=10))

    def __str__(self):
        return "STOP: "+self.stopid

    class Meta:
        verbose_name_plural = "Stops" 
        indexes = [
            models.Index(fields=['stopid'])
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
            models.Index(fields=['rain']),
            models.Index(fields=['date']),
            models.Index(fields=['time']),
            models.Index(fields=['date','time']),
        ]

class Timetable(models.Model):
    stopid = models.IntegerField(null=True)
    lineid = models.CharField(max_length=10)
    dayofservice = models.CharField(max_length=10)
    destination = models.CharField(max_length=50, null=True)
    schedule = ArrayField(models.CharField(max_length=5))

    def __str__(self):
        return self.stopid
    
    class Meta:
        verbose_name_plural = "Time Table"
        indexes = [
            models.Index(fields=['stopid']),
            models.Index(fields=['lineid']),
            models.Index(fields=['dayofservice']),
            models.Index(fields=['stopid', 'lineid', 'dayofservice','destination']),
        ]



 
