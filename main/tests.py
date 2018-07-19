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
        cls.routes = Routes.objects.create(routeid=1_80, lineid=1, direction=1, stopids=[1, 2, 3, 4, 5])

    def test_creation_of_routes(self):
        self.assertTrue(isinstance(self.routes, Routes))

    def test_data_in_routes(self):
        self.assertEqual(self.routes.routeid, 1_80)

    def test_lines_no_terms_status_code(self):
        response = self.client.get('/main/lines')
        self.assertEquals(response.status_code, 400)

    def test_lines_no_source_status_code(self):
        response = self.client.get('/main/lines', {'destination': 4})
        self.assertEquals(response.status_code, 400)

    def test_lines_no_destination_status_code(self):
        response = self.client.get('/main/lines', {'source': 2})
        self.assertEquals(response.status_code, 400)   

    def test_lines_bad_terms_status_code(self):
        response = self.client.get('/main/lines', {'source': '325X', 'destination': '4407Y'})
        self.assertEquals(response.status_code, 400)        

    def test_lines_good_terms_status_code(self):
        response = self.client.get('/main/lines', {'source': 2, 'destination': 4})
        self.assertEquals(response.status_code, 200)

    def test_lines_contains_correct_json(self):
        response = self.client.get('/main/lines', {'source': 2, 'destination': 4})
        self.assertEquals(response.status_code, 200)
        self.assertJSONEqual(response.content, '["1"]')


# class TestJourneytime(TestCase):


# class TestGet_address(TestCase):


# class TestRoutes(TestCase):


class TestStops(TestCase):

    @classmethod
    def setUpTestData(cls):
        cls.routes = Routes.objects.create(routeid='39A_80', lineid='39A', direction=1, stopids=[2, 3, 4, 6, 7])
        cls.stops = Stops.objects.create(stopid=2, address='Parnell', lat=53.35224111, lng=-6.26369500, lines=['39A'])
        cls.stops = Stops.objects.create(stopid=3, address='Granby', lat=53.35230694, lng=-6.26378306, lines=['39A'])
        cls.stops = Stops.objects.create(stopid=4, address='Rotunda', lat=53.35256694, lng=-6.26416611, lines=['39A'])
        cls.stops = Stops.objects.create(stopid=6, address='Martin', lat=53.35274389, lng=-6.26444306, lines=['39A'])
        cls.stops = Stops.objects.create(stopid=7, address='Hospital', lat=53.35283611, lng=-6.26456194, lines=['39A'])

    def test_creation_of_routes(self):
        self.assertTrue(isinstance(self.routes, Routes))

    def test_creation_of_stops(self):
        self.assertTrue(isinstance(self.stops, Stops))

    def test_data_in_routes(self):
        self.assertEqual(self.routes.routeid, '39A_80')

    def test_data_in_stops(self):
        self.assertIn(self.stops.stopid, [2, 3, 4, 6, 7])

    def test_lines_no_terms_status_code(self):
        response = self.client.get('/main/stops')
        self.assertEquals(response.status_code, 200)

    # def test_lines_no_source_status_code(self):
    #     response = self.client.get('/main/lines', {'destination': 4})
    #     self.assertEquals(response.status_code, 400)

    # def test_lines_no_destination_status_code(self):
    #     response = self.client.get('/main/lines', {'source': 2})
    #     self.assertEquals(response.status_code, 400)   

    # def test_lines_bad_terms_status_code(self):
    #     response = self.client.get('/main/lines', {'source': '325X', 'destination': '4407Y'})
    #     self.assertEquals(response.status_code, 400)        

    # def test_lines_good_terms_status_code(self):
    #     response = self.client.get('/main/lines', {'source': 2, 'destination': 4})
    #     self.assertEquals(response.status_code, 200)

    # def test_lines_contains_correct_json(self):
    #     response = self.client.get('/main/lines', {'source': 2, 'destination': 4})
    #     self.assertEquals(response.status_code, 200)
    #     self.assertJSONEqual(response.content, '["1"]')



# Test Models

# class TestBankHolidays(TestCase):

# class TestCoefficients(TestCase):

# class TestJourneyLogs(TestCase):

# class TestLines(TestCase):

# class TestLinked(TestCase):

# class TestRoutes(TestCase):

# class TestStops(TestCase):

# class TestWeather(TestCase):
