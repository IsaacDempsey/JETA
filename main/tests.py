from django.test import TestCase
from .switch import Switch_start
import unittest
# Create your tests here.
class Testing(unittest.TestCase):
    
    """Test if bus stops linked"""    
    def test_switch(self):
        self.start = 4348
        self.desitination = 7564
        switch1 = Switch_start(self.start,self.desitination).switch_check()
        self.assertEqual(switch1,False)