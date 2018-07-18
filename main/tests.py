from django.http import HttpRequest
from django.test import TestCase
from django.test import SimpleTestCase
from django.urls import reverse

import json
import unittest

from . import models
from . import views

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

    def test_lines_no_terms_status_code(self):
    	response = self.client.get('/main/lines')
    	self.assertEquals(response.status_code, 400)

    def test_lines_no_source_status_code(self):
    	response = self.client.get('/main/lines?destination=4407')
    	self.assertEquals(response.status_code, 400)

    def test_lines_no_destination_status_code(self):
    	response = self.client.get('/main/lines?source=325')
    	self.assertEquals(response.status_code, 400)   

    def test_lines_bad_terms_status_code(self):
    	response = self.client.get('/main/lines?source=325A&destination=4407X')
    	self.assertEquals(response.status_code, 400)		

    def test_lines_good_terms_status_code(self):
    	response = self.client.get('/main/lines?source=325&destination=4407')
    	self.assertEquals(response.status_code, 200)

    def test_lines_contains_correct_json(self):
    	response = self.client.get('/main/lines?source=325&destination=4407')
    	expected_data = json.dumps(['145'])
    	self.assertEquals(response.status_code, 200)
    	self.assertJSONEqual(response.json(), expected_data)


# class TestJourneytime(TestCase):


# class TestGet_address(TestCase):


# class TestRoutes(TestCase):


# class TestStops(TestCase):



# Test Models

# class TestBankHolidays(TestCase):

# class TestCoefficients(TestCase):

# class TestJourneyLogs(TestCase):

# class TestLines(TestCase):

# class TestLinked(TestCase):

# class TestRoutes(TestCase):

# class TestStops(TestCase):

# class TestWeather(TestCase):
