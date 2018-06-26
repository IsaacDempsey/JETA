# This python script downloads dublin route data from RTPI
import psycopg2  # ------------------------------ CONNECTION FOR THE DB
import requests  # ------------------------------ Scrapping the web content
import json  # ---------------------------------- Read the JSON File


# -------------- Custom Exception Class to display any error while reading the json (E.g., Server Error)
class JsonLoadError(Exception):
    def __init__(self, message):
        # Call the base class constructor with the parameters it needs
        super().__init__(message)

# ----------- Modularizing the scrapper


def main():
    # ----------- API for the scrapping the data
    url = "https://data.smartdublin.ie/cgi-bin/rtpi/busstopinformation?format=json"
    # url = "https://data.smartdublin.ie/cgi-bin/rtpi/realtimebusinformation?format=json" # ------ URL Used to test the Custom Exception Class

    # ------------- Try to get the response from the scrapping request
    try:
        response = requests.get(url, timeout=5)
        # Raise and check whats the status. Will except errors if the response is not 200 OK
        response.raise_for_status()
    except requests.exceptions.HTTPError as errh:
        print("Http Error:", errh)
    except requests.exceptions.ConnectionError as errc:
        print("Error Connecting:", errc)
    except requests.exceptions.Timeout as errt:
        print("Timeout Error:", errt)
    except requests.exceptions.RequestException as reqErr:
        print("Fatal Error: ", reqErr)

    # TRY CONNECTING TO THE DATABASE
    try:
        connect_str = {
            'dbname': 'jetaDb',
            'user': 'postgres',
            'password': '00001234',
            'host': 'localhost',
            'port': '5433'  # ------------ PORT 5433 for server db
        }  # ---------------------------- Connection String to connect to the PostgreSQL Database
        # --------------------------- Connecting to the PostgreSQL Database using psycopg2 package
        conn = psycopg2.connect(**connect_str)

        # ----------------------------------------- psycopg2 cursor that can execute queries on the db
        cursor = conn.cursor()
        busRoutes = json.loads(response.text)
        if busRoutes['errorcode'] == "0":
            # Below are the list of columns
            for i,busRoute in enumerate(busRoutes['results']):
                operator = busRoute['operator']
                route = busRoute['route']

                cursor.execute('INSERT INTO main_dublinroutes (operator, "routeId") VALUES (%s, %s)',
                               (operator,route)) # -- INSERT INTO TABLE
        else:
            # ---------------- IF the error code isn't '0' raise it
            raise JsonLoadError(busRoutes['errorcode'])

        # Commit the inserts and close the connection

        conn.commit()
        cursor.close()
        conn.close()
    except JsonLoadError as err:
        print("ERROR: \tJSON received with an Error Code: {}\n\tPlease check the url".format(err))
    except Exception as e:
        print("ERROR:::: CONNECTION ERROR: \n{}".format(e))

if __name__=="__main__":
    main()
