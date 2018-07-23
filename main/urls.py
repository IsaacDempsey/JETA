from django.urls import path
from . import views

app_name='main'

urlpatterns = [
    path('', views.index, name='index'),
    path('get_address', views.get_address, name='get_address'),
    path('journeytime', views.journeytime, name='journeytime'),
    path('lines', views.lines, name='lines'),
    path('locations', views.locations, name='locations'),
    path('routes', views.routes, name='routes'),
    path('stops', views.stops, name='stops'),
    path('get_route', views.get_route, name='get_route')

]
