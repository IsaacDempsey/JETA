from django.urls import path,re_path
from . import views

app_name='main'

urlpatterns = [
    path('', views.index, name='index'),
    path('stations', views.stations, name='stations'),
    path('get_address', views.get_address, name='get_address'),
    path('linked', views.linked, name='linked'),
    path('stops', views.stops, name='stops')
]
