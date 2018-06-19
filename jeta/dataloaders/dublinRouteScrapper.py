import psycopg2
import requests
from psycopg2 import sql
import json

class JsonLoadError(Exception):
    def __init__(self, message):
        # Call the base class constructor with the parameters it needs
        super().__init__(message)

def main():
    url = "https://data.smartdublin.ie/cgi-bin/rtpi/routelistinformation?&format=json"
    # url = "https://data.smartdublin.ie/cgi-bin/rtpi/realtimebusinformation?format=json"

    try:
        response = requests.get(url, timeout=5)
        response.raise_for_status()
    except requests.exceptions.HTTPError as errh:
        print("Http Error:", errh)
    except requests.exceptions.ConnectionError as errc:
        print("Error Connecting:", errc)
    except requests.exceptions.Timeout as errt:
        print("Timeout Error:", errt)
    except requests.exceptions.RequestException as reqErr:
        print("Fatal Error: ", reqErr)
    

    try:
        connect_str = {
            'dbname': 'jetaDb',
            'user': 'postgres',
            'password': '00001234',
            'host': 'localhost',
            'port': '5433'
        }  # ---------------------------- Connection String to connect to the PostgreSQL Database
        conn = psycopg2.connect(**connect_str) # --------------------------- Connecting to the PostgreSQL Database using psycopg2 package

        cursor = conn.cursor() # ----------------------------------------- psycopg2 cursor that can execute queries on the db
        busStops = json.loads(response.text)
        if busStops['errorcode'] == "0":
            print("Success")
            for i,busStop in enumerate(busStops['results']):
                operator = busStop['operator']
                route = busStop['route']

                cursor.execute('INSERT INTO main_dublinroutes (operator, "routeId") VALUES (%s, %s)',
                               (operator,route))
                print(i)
        else:
            raise JsonLoadError(busStops['errorcode'])

        conn.commit()
        cursor.close()
        conn.close()
    except JsonLoadError as err:
        print("ERROR: \tJSON received with an Error Code: {}\n\tPlease check the url".format(err))
    except Exception as e:
        print("ERROR:::: CONNECTION ERROR: \n{}".format(e))

if __name__=="__main__":
    main()
