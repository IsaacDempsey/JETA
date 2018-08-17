from django.contrib import admin
from .models import BankHolidays, Coefficients, Fares, Lines, Linked, Routes, Stops, Weather

# Register your models here.
admin.site.register(BankHolidays)
admin.site.register(Coefficients)
admin.site.register(Fares)
admin.site.register(Lines)
admin.site.register(Linked)
admin.site.register(Routes)
admin.site.register(Stops)
admin.site.register(Weather)

