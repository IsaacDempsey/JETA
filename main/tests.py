from django.http import HttpRequest
from django.test import TestCase
from django.test import SimpleTestCase
from django.urls import reverse
import unittest

from .models import *
from .views import *

# Test Views

# Code reference: https://wsvincent.com/django-testing-tutorial/
class TestIndex(SimpleTestCase):

    def test_redirect_status_code(self):
        response = self.client.get('/')
        self.assertEquals(response.status_code, 301)

    def test_index_status_code(self):
        response = self.client.get('/main/')
        self.assertEquals(response.status_code, 200)

    def test_view_uses_correct_template(self):
        response = self.client.get(reverse('main:index'))
        self.assertEquals(response.status_code, 200)
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
        self.assertEquals(response.status_code, 400)

    def test_lines_no_source_status_code(self):
        response = self.client.get('/main/lines', {'destination': 770})
        self.assertEquals(response.status_code, 400)

    def test_lines_no_destination_status_code(self):
        response = self.client.get('/main/lines', {'source': 768})
        self.assertEquals(response.status_code, 400)   

    def test_lines_bad_terms_status_code(self):
        response = self.client.get('/main/lines', {'source': '770X', 'destination': '768Y'})
        self.assertEquals(response.status_code, 400)        

    def test_lines_good_terms_status_code(self):
        response = self.client.get('/main/lines', {'source': 768, 'destination': 770})
        self.assertEquals(response.status_code, 200)

    def test_lines_contains_correct_json(self):
        response = self.client.get('/main/lines', {'source': 768, 'destination': 770})
        self.assertEquals(response.status_code, 200)
        self.assertJSONEqual(response.content, '["39A"]')


class TestJourneytime(TestCase):

    @classmethod
    def setUpTestData(cls):
        cls.routes = Routes.objects.create(routeid='39A_40', lineid='39A', direction=1, stopids=[767, 768, 769, 770, 771])
        cls.coefficients = Coefficients()
        Coefficients.objects.bulk_create([
            Coefficients(segment="767_768", intercept=123, arrivaltime=0, rain=1, fri=-2, mon=0, sat=-10, sun=-10, thu=-10),
            Coefficients(segment="769_770", intercept=70, arrivaltime=0, rain=0, fri=-1, mon=-2, sat=-10, sun=-11, thu=-11),
            Coefficients(segment="768_769", intercept=70, arrivaltime=0, rain=0, fri=0, mon=-4, sat=-12, sun=-19, thu=-19),
            Coefficients(segment="770_771", intercept=34, arrivaltime=0, rain=0, fri=0, mon=-1, sat=-2, sun=-3, thu=-3)
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
        self.assertEquals(response.status_code, 400)

    def test_journeytime_all_terms_status_code(self):
        response = self.client.get('/main/journeytime?source=767&destination=770&lineid=39A&time=1530008000')
        self.assertEquals(response.status_code, 200)

# class TestGet_address(TestCase):


# class TestRoutes(TestCase):


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
        self.assertEquals(response.status_code, 200)

    def test_stops_only_source_status_code(self):
        response = self.client.get('/main/stops', {'source': 768})
        self.assertEquals(response.status_code, 200)

    def test_stops_only_destination_status_code(self):
        response = self.client.get('/main/stops', {'destination': 770})
        self.assertEquals(response.status_code, 200)

    def test_stops_only_lineid_status_code(self):
        response = self.client.get('/main/stops', {'lineid': '39A'})
        self.assertEquals(response.status_code, 200)

    def test_stops_source_and_destination_status_code(self):
        response = self.client.get('/main/stops', {'source': 768, 'destination': 770})
        self.assertEquals(response.status_code, 200)

    def test_stops_source_and_lineid_status_code(self):
        response = self.client.get('/main/stops', {'source': 768, 'lineid': '39A'})
        self.assertEquals(response.status_code, 200)

    def test_stops_destination_and_lineid_status_code(self):
        response = self.client.get('/main/stops', {'destination': 770, 'lineid': '39A'})
        self.assertEquals(response.status_code, 200)

    def test_stops_all_terms_status_code(self):
        response = self.client.get('/main/stops', {'source': 768, 'destination': 770, 'lineid': '39A'})
        self.assertEquals(response.status_code, 200)

    def test_stops_bad_source_status_code(self):
        response = self.client.get('/main/stops', {'source': '2X'})
        self.assertEquals(response.status_code, 400)

    def test_stops_bad_destination_status_code(self):
        response = self.client.get('/main/stops', {'destination': '6Y'})
        self.assertEquals(response.status_code, 400)

    def test_stops_bad_lineid_status_code(self):
        response = self.client.get('/main/stops', {'lineid': 'Hello'})
        self.assertEquals(response.status_code, 400) 

    def test_stops_contains_correct_json(self):
        response = self.client.get('/main/stops', {'source': 767, 'destination': 770, 'lineid': '39A'})
        self.assertEquals(response.status_code, 200)
        self.assertEqual(response.json()[0]['stop_name'], 'Parnell')
        self.assertEqual(response.json()[1]['coord'], [-6.26378306, 53.35230694])
        self.assertEqual(response.json()[2]['lineid'], {"39A":2})
        self.assertEqual(response.json()[3]['stop_id'], 770)


# Test Models

# class TestBankHolidays(TestCase):

# class TestCoefficients(TestCase):

# class TestJourneyLogs(TestCase):

# class TestLines(TestCase):

# class TestLinked(TestCase):

# class TestRoutes(TestCase):

# class TestStops(TestCase):

# class TestWeather(TestCase):
