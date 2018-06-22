import requests as re
import json


url = "http://maps.googleapis.com/maps/api/geocode/json?latlng=53.35224111,-6.26369500&sensor=false"
response = re.get(url)

