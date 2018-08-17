MyJeta
======

MyJeta (My Journey Estimated Time of Arrival) is a web application which predicts the expected journey time of a Dublin Bus passanger. It uses historic Dublin Bus and weather data to create dynamic travel time estimates. When presented with any bus route, departure time, day of the week and current weather conditions, the application produces an accurate estimate of journey travel time. Realtime bus arrival data is integrated into the the application to provide the user with an estimated time of arrival given the time at which the next bus arrives. The application also provides users with station specific timetable information, bus fare information for their chosen journey, and a news stream containing Dublin Bus related information. To facilitate the selection of a route, MyJeta plots potential destinations on a map for the user to select from, given their starting stop. The application user interface is optimized for both desktop and mobile devices.

Technologies used:

- Django
- Nginx and Gunicorn
- PostgreSQL database
- Javascript, Jquery, Bootstrap

Requirements
------------

Requirements for the application are listed in the requirements.txt file. To install, create a new enviroment and pip install them using the command:

pip install -r requirements.txt


Application Installation Instructions
-------------------------------------

1. Create and activate a new environment.
2. Install the packages specified in the requirements file (see above).
3. Clone the web application into a empty directory:

    git clone https://github.com/IsaacDempsey/MyJeta.git

4. Run the application using the command:

    python manage.py runserver

5. Navigate in a web browser to the following address:

    localhost:8000


:License: GPLv3
