from django.urls import path,re_path
from . import views

app_name='main'

urlpatterns = [
    path('', views.index, name='index'),
    path('destinations', views.destinations, name='destinations'),
    path('get_address', views.get_address, name='get_address'),
    re_path('get_start', views.get_start, name='get_start'),
    path('journeytime', views.journeytime, name='journeytime'),
    path('lines', views.lines, name='lines'),
    path('linked', views.linked, name='linked'),
    path('routes', views.routes, name='routes'),
    path('route_result', views.route_result, name='route_result'),
    path('stops', views.stops, name='stops')
]
