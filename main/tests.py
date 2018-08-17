from django.http import HttpRequest
from django.test import TestCase
from django.test import SimpleTestCase
from django.urls import reverse

from django.contrib.staticfiles.testing import StaticLiveServerTestCase
from selenium.webdriver.firefox.webdriver import WebDriver
from selenium.webdriver.firefox.firefox_profile import FirefoxProfile

import unittest

from .models import *
from .views import *

# Test Views

# Code reference: https://wsvincent.com/django-testing-tutorial/
class TestIndex(SimpleTestCase):

    def test_redirect_status_code(self):
        response = self.client.get('/')
        self.assertEqual(response.status_code, 301)

    def test_index_status_code(self):
        response = self.client.get('/main/')
        self.assertEqual(response.status_code, 200)

    def test_view_uses_correct_template(self):
        response = self.client.get(reverse('main:index'))
        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, 'index.html')

    def test_index_contains_correct_html(self):
        response = self.client.get('/main/')
        self.assertContains(response, 'Get your Journey Time')

    def test_index_does_not_contain_incorrect_html(self):
        response = self.client.get('/main/')
        self.assertNotContains(response, "I SHOULDN'T BE HERE...")


class TestLines(TestCase):

    @classmethod
    def setUpTestData(cls):
        cls.routes = Routes.objects.create(routeid='39A_40', lineid='39A', direction=1, stopids=[767, 768, 769, 770, 771])

    def test_creation_of_routes(self):
        self.assertTrue(isinstance(self.routes, Routes))

    def test_data_in_routes_object(self):
        self.assertEqual(self.routes.routeid, '39A_40')

    def test_data_in_routes_table(self):
        self.assertEqual(Routes.objects.all().values('routeid')[0]['routeid'], '39A_40')

    def test_lines_no_terms_status_code(self):
        response = self.client.get('/main/lines')
        self.assertEqual(response.status_code, 400)

    def test_lines_no_source_status_code(self):
        response = self.client.get('/main/lines', {'destination': 770})
        self.assertEqual(response.status_code, 400)

    def test_lines_no_destination_status_code(self):
        response = self.client.get('/main/lines', {'source': 768})
        self.assertEqual(response.status_code, 400)   

    def test_lines_bad_terms_status_code(self):
        response = self.client.get('/main/lines', {'source': '770X', 'destination': '768Y'})
        self.assertEqual(response.status_code, 400)        

    def test_lines_good_terms_status_code(self):
        response = self.client.get('/main/lines', {'source': 768, 'destination': 770})
        self.assertEqual(response.status_code, 200)

    def test_lines_contains_correct_json(self):
        response = self.client.get('/main/lines', {'source': 768, 'destination': 770})
        self.assertEqual(response.status_code, 200)
        self.assertJSONEqual(response.content, '["39A"]')


class TestJourneytime(TestCase):

    @classmethod
    def setUpTestData(cls):
        cls.routes = Routes.objects.create(routeid='39A_40', lineid='39A', direction=1, stopids=[767, 768, 769, 770, 771])
        cls.coefficients = Coefficients()
        Coefficients.objects.bulk_create([
            Coefficients(segment="767_768", intercept=123, arrivaltime=0, rain=1, 
                fri=-2, mon=0, sat=-10, sun=-10, thu=-10, tue=-10, holiday=1),
            Coefficients(segment="769_770", intercept=70, arrivaltime=0, rain=0, 
                fri=-1, mon=-2, sat=-10, sun=-11, thu=-11, tue=-10, holiday=-7),
            Coefficients(segment="768_769", intercept=70, arrivaltime=0, rain=0, 
                fri=0, mon=-4, sat=-12, sun=-19, thu=-19, tue=-10, holiday=5),
            Coefficients(segment="770_771", intercept=34, arrivaltime=0, rain=0, 
                fri=0, mon=-1, sat=-2, sun=-3, thu=-3, tue=-10, holiday=7)
            ])

    def test_creation_of_routes(self):
        self.assertTrue(isinstance(self.routes, Routes))

    def test_creation_of_coefficients(self):
        self.assertTrue(isinstance(self.coefficients, Coefficients))    

    def test_data_in_routes_table(self):
        self.assertEqual(Routes.objects.all().values('routeid')[0]['routeid'], '39A_40')

    def test_data_in_coefficients_table(self):
        segments_list = Coefficients.objects.all().values_list('segment', flat=True)
        self.assertTrue(any(segment in ["767_768", "768_769", "769_770", "770_771"] for segment in list(segments_list)))

    def test_journeytime_no_terms_status_code(self):
        response = self.client.get('/main/journeytime')
        self.assertEqual(response.status_code, 400)

    def test_journeytime_missing_rain_status_code(self):
        response = self.client.get('/main/journeytime', {"source": 768, "destination": 770, "lineid": "39A", "time": 1530008000})
        self.assertEqual(response.status_code, 200)

    def test_journeytime_all_terms_invalid_stopid_status_code(self):
        response = self.client.get('/main/journeytime', {"source": 1000, "destination": 2000, "lineid": "39A", "time": 1530008000})
        self.assertEqual(response.status_code, 400) 
        
    def test_journeytime_all_terms_invalid_lineid_status_code(self):
        response = self.client.get('/main/journeytime', {"source": 768, "destination": 770, "lineid": "XXX", "time": 1530008000})
        self.assertEqual(response.status_code, 400) 

    def test_journeytime_all_terms_valid_status_code(self):
        response = self.client.get('/main/journeytime', {"source": 768, "destination": 770, "lineid": "39A", "time": 1530008000})
        self.assertEqual(response.status_code, 200)

    def test_journeytime_contains_correct_json(self):
        response = self.client.get('/main/journeytime', {"source": 768, "destination": 770, "lineid": "39A", "time": 1530008000})
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json()['arrivaltime']) 
        self.assertTrue(response.json()['totaltraveltime'])
        self.assertTrue(any(segment in ["767_768", "768_769", "769_770", "770_771"] 
            for segment in list(response.json()['segment_times'].keys())))
        

class TestGet_address(TestCase):
    
    @classmethod
    def setUpTestData(cls):
        cls.stops = Stops.objects.create(stopid=767, address='Parnell', lat=53.35224111, lng=-6.26369500, lines=['39A'])

    def test_creation_of_stops(self):
        self.assertTrue(isinstance(self.stops, Stops))

    def test_data_in_stops_table(self):
        self.assertEqual(Stops.objects.all().values('stopid')[0]['stopid'], 767)

    def test_get_address_no_term_status_code(self):
        response = self.client.get('/main/get_address', HTTP_X_REQUESTED_WITH='XMLHttpRequest')
        self.assertEqual(response.status_code, 200)

    def test_get_address_bad_term_status_code(self):
        response = self.client.get('/main/get_address', {'term': 'XYZ'}, HTTP_X_REQUESTED_WITH='XMLHttpRequest')
        self.assertEqual(response.status_code, 200)

    def test_get_address_valid_term_status_code(self):
        response = self.client.get('/main/get_address', {'term': 'Par'}, HTTP_X_REQUESTED_WITH='XMLHttpRequest')
        self.assertEqual(response.status_code, 200)

    def test_get_address_stop_name_json_content(self):
        response = self.client.get('/main/get_address', {'term': 'Par'}, HTTP_X_REQUESTED_WITH='XMLHttpRequest')
        self.assertTrue(response.json()[0]['label'])
    
    def test_get_address_stopid_json_content(self):
        response = self.client.get('/main/get_address', {'term': 76}, HTTP_X_REQUESTED_WITH='XMLHttpRequest')
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json()[0]['label'])

class TestLocations(TestCase):

    @classmethod
    def setUpTestData(cls):
        cls.stops = Stops()
        Stops.objects.bulk_create([
            Stops(stopid=767, address='Parnell', lat=53.0000, lng=-6.0000, lines=['39A']),
            Stops(stopid=768, address='Granby', lat=53.0003, lng=-6.0003, lines=['39A']),
            Stops(stopid=769, address='Rotunda', lat=53.0008, lng=-6.0008, lines=['39A']),
            Stops(stopid=770, address='Martin', lat=53.0012, lng=-6.0013, lines=['39A']),
            Stops(stopid=771, address='Hospital', lat=53.0017, lng=-6.0017, lines=['39A'])
            ])
    
    def test_creation_of_stops(self):
        self.assertTrue(isinstance(self.stops, Stops))

    def test_data_in_stops_table(self):
        stopid_list = Stops.objects.all().values_list('stopid', flat=True)
        self.assertTrue(any(stop in [767, 768, 769, 770, 771] for stop in list(stopid_list)))

    def test_locations_no_terms_status_code(self):
        response = self.client.get('/main/locations')
        self.assertEqual(response.status_code, 200)

    def test_locations_no_terms_json_results(self):
        response = self.client.get('/main/locations')
        self.assertEqual(len(response.json()), 5)

    def test_locations_only_lat_given_json_results(self):
        response = self.client.get('/main/locations', {'lat': 53.0003})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()[0]['stop_id'], 767)
        self.assertEqual(len(response.json()), 3)

    def test_locations_only_lng_given_json_results(self):
        response = self.client.get('/main/locations', {'lng': -6.0003})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()[0]['stop_id'], 767)
        self.assertEqual(len(response.json()), 3)

    def test_locations_lng_and_lat_given_json_results(self):
        response = self.client.get('/main/locations', {'lat': 53.0003, 'lng': -6.0003})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()[0]['stop_id'], 767)
        self.assertEqual(len(response.json()), 3)

    def test_locations_lat_lng_radius_given_json_results(self):
        response = self.client.get('/main/locations', {'lat': 53.0003, 'lng': -6.0003, 'radius': 0.0010})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()[0]['stop_id'], 767)
        self.assertEqual(len(response.json()), 4)


class TestStops(TestCase):

    @classmethod
    def setUpTestData(cls):
        cls.routes = Routes.objects.create(routeid='39A_40', lineid='39A', direction=1, stopids=[767, 768, 769, 770, 771])
        cls.stops = Stops()
        Stops.objects.bulk_create([
            Stops(stopid=767, address='Parnell', lat=53.35224111, lng=-6.26369500, lines=['39A']),
            Stops(stopid=768, address='Granby', lat=53.35230694, lng=-6.26378306, lines=['39A']),
            Stops(stopid=769, address='Rotunda', lat=53.35256694, lng=-6.26416611, lines=['39A']),
            Stops(stopid=770, address='Martin', lat=53.35274389, lng=-6.26444306, lines=['39A']),
            Stops(stopid=771, address='Hospital', lat=53.35283611, lng=-6.26456194, lines=['39A'])
            ])

    def test_creation_of_routes(self):
        self.assertTrue(isinstance(self.routes, Routes))

    def test_creation_of_stops(self):
        self.assertTrue(isinstance(self.stops, Stops))

    def test_data_in_routes_table(self):
        self.assertEqual(Routes.objects.all().values('routeid')[0]['routeid'], '39A_40')

    def test_data_in_stops_table(self):
        stopid_list = Stops.objects.all().values_list('stopid', flat=True)
        self.assertTrue(any(stop in [767, 768, 769, 770, 771] for stop in list(stopid_list)))

    def test_stops_no_terms_status_code(self):
        response = self.client.get('/main/stops')
        self.assertEqual(response.status_code, 200)

    def test_stops_only_source_status_code(self):
        response = self.client.get('/main/stops', {'source': 768})
        self.assertEqual(response.status_code, 200)

    def test_stops_only_destination_status_code(self):
        response = self.client.get('/main/stops', {'destination': 770})
        self.assertEqual(response.status_code, 200)

    def test_stops_only_lineid_status_code(self):
        response = self.client.get('/main/stops', {'lineid': '39A'})
        self.assertEqual(response.status_code, 200)

    def test_stops_source_and_destination_status_code(self):
        response = self.client.get('/main/stops', {'source': 768, 'destination': 770})
        self.assertEqual(response.status_code, 200)

    def test_stops_source_and_lineid_status_code(self):
        response = self.client.get('/main/stops', {'source': 768, 'lineid': '39A'})
        self.assertEqual(response.status_code, 200)

    def test_stops_destination_and_lineid_status_code(self):
        response = self.client.get('/main/stops', {'destination': 770, 'lineid': '39A'})
        self.assertEqual(response.status_code, 200)

    def test_stops_all_terms_status_code(self):
        response = self.client.get('/main/stops', {'source': 768, 'destination': 770, 'lineid': '39A'})
        self.assertEqual(response.status_code, 200)

    def test_stops_bad_source_status_code(self):
        response = self.client.get('/main/stops', {'source': '2X'})
        self.assertEqual(response.status_code, 400)

    def test_stops_bad_destination_status_code(self):
        response = self.client.get('/main/stops', {'destination': '6Y'})
        self.assertEqual(response.status_code, 400)

    def test_stops_bad_lineid_status_code(self):
        response = self.client.get('/main/stops', {'lineid': 'Hello'})
        self.assertEqual(response.status_code, 400) 

    def test_stops_contains_correct_json(self):
        response = self.client.get('/main/stops', {'source': 767, 'destination': 770, 'lineid': '39A'})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()[0]['stop_name'], 'Parnell')
        self.assertEqual(response.json()[1]['coord'], [-6.26378306, 53.35230694])
        self.assertEqual(response.json()[2]['lineid'], {"39A":2})
        self.assertEqual(response.json()[3]['stop_id'], 770)

class TestGet_fares(TestCase):

    @classmethod
    def setUpTestData(cls):
        cls.fares = Fares()
        Fares.objects.bulk_create([
            Fares(stop=1, route='39A', direction=1, stage=1, pattern_id='00000001', seq=0),
            Fares(stop=2, route='39A', direction=1, stage=2, pattern_id='00000001', seq=1),
            Fares(stop=1, route='39A', direction=0, stage=1, pattern_id='00000011', seq=0),
            Fares(stop=1, route='39A', direction=0, stage=2, pattern_id='00000011', seq=0)
            ])

    def test_fares_no_terms_status_code(self):
        response = self.client.get('/main/get_fares')
        self.assertEqual(response.status_code, 400)

    def test_fares_only_source_status_code(self):
        response = self.client.get('/main/get_fares', {'source': 1})
        self.assertEqual(response.status_code, 400)

    def test_fares_only_destination_status_code(self):
        response = self.client.get('/main/get_fares', {'destination': 2})
        self.assertEqual(response.status_code, 400)

    def test_fares_only_lineid_status_code(self):
        response = self.client.get('/main/get_fares', {'line_id': '39A'})
        self.assertEqual(response.status_code, 400)

    def test_fares_source_and_destination_status_code(self):
        response = self.client.get('/main/get_fares', {'source': 1, 'destination': 2})
        self.assertEqual(response.status_code, 400)

    def test_fares_source_and_lineid_status_code(self):
        response = self.client.get('/main/get_fares', {'source': 1, 'line_id': '39A'})
        self.assertEqual(response.status_code, 400)

    def test_fares_destination_and_lineid_status_code(self):
        response = self.client.get('/main/get_fares', {'destination': 2, 'line_id': '39A'})
        self.assertEqual(response.status_code, 400)

    def test_fares_all_terms_status_code(self):
        response = self.client.get('/main/get_fares', {'source': 1, 'destination': 2, 'line_id': '39A'})
        self.assertEqual(response.status_code, 200)


# class TestGet_timetable(TestCase):

# class TestGet_switch(TestCase):


# Test Front End

# Code reference: https://docs.djangoproject.com/en/2.0/topics/testing/tools/
class SeleniumTests(StaticLiveServerTestCase):

    @classmethod
    def setUpClass(cls):
        super().setUpClass()

        # cls.url = "http://localhost:8000"https://www.reddit.com/r/worldnews/
        cls.url = "http://csi420-02-vm6.ucd.ie"

        # Profile setup code:
        # https://stackoverflow.com/questions/16292634/always-allow-geolocation-in-firefox-using-selenium/32719667
        cls.profile = FirefoxProfile()
        cls.profile.set_preference("geo.prompt.testing", True)
        cls.profile.set_preference("geo.prompt.testing.allow", True)

        cls.browser = WebDriver(firefox_profile=cls.profile)
        cls.browser.implicitly_wait(10)


    @classmethod
    def tearDownClass(cls):
        cls.browser.quit()
        super().tearDownClass()


    def test_enter_stopid_in_source_box(self):
        self.browser.get(self.url + "/main/")

        source_box = self.browser.find_element_by_id("source")
        source_box.send_keys("768")

        drop_down = self.browser.find_element_by_xpath("//div[text()='Dublin (UCD Stillorgan Rd Flyover), 768']")

        self.assertEqual(drop_down.text, "Dublin (UCD Stillorgan Rd Flyover), 768")


    def test_enter_address_in_source_box(self):
        self.browser.get(self.url + "/main/")

        source_box = self.browser.find_element_by_id("source")
        source_box.send_keys("ucd")

        drop_down = self.browser.find_element_by_xpath("//div[text()='Dublin (UCD Stillorgan Rd Flyover), 768']")

        self.assertEqual(drop_down.text, "Dublin (UCD Stillorgan Rd Flyover), 768")






