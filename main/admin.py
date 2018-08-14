from django.contrib import admin
from .models import Routes, Lines, Stops, Weather, BankHolidays, Linked, JourneyLogs, Coefficients

# Register your models here.
admin.site.register(Routes)
admin.site.register(Lines)
admin.site.register(Stops)
admin.site.register(Linked)
admin.site.register(Coefficients)
admin.site.register(JourneyLogs)
admin.site.register(Weather)
admin.site.register(BankHolidays)

