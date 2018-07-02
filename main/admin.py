from django.contrib import admin
from .models import Routes, Lines, Stops, JourneyLogs, Weather, BankHolidays

# Register your models here.
admin.site.register(Routes)
admin.site.register(Lines)
admin.site.register(Stops)
admin.site.register(JourneyLogs)
admin.site.register(Weather)
admin.site.register(BankHolidays)
