# This python script downloads dublin bus stops data from RTPI 
import psycopg2 # ------------------------------ CONNECTION FOR THE DB
import requests # ------------------------------ Scrapping the web content
import json # ---------------------------------- Read the JSON File

class JsonLoadError(Exception): # -------------- Custom Exception Class to display any error while reading the json (E.g., Server Error)
    def __init__(self, message):
        # Call the base class constructor with the parameters it needs
        super().__init__(message)

# ----------- Modularizing the scrapper
def main():
    url = "https://data.smartdublin.ie/cgi-bin/rtpi/busstopinformation?format=json"  # ----------- API for the scrapping the data
    # url = "https://data.smartdublin.ie/cgi-bin/rtpi/realtimebusinformation?format=json" # ------ URL Used to test the Custom Exception Class

    # ------------- Try to get the response from the scrapping request
    try:
        response = requests.get(url, timeout=5)
        response.raise_for_status() # Raise and check whats the status. Will except errors if the response is not 200 OK
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
            'port': '5433' # ------------ PORT 5433 for server db
        }  # ---------------------------- Connection String to connect to the PostgreSQL Database
        conn = psycopg2.connect(**connect_str) # --------------------------- Connecting to the PostgreSQL Database using psycopg2 package

        cursor = conn.cursor() # ----------------------------------------- psycopg2 cursor that can execute queries on the db
        busStops = json.loads(response.text)
        if busStops['errorcode'] == "0": # ------------------------------- Start loading only if JSON returns an error code of '0'
            # Below are the list of columns
            loadTime = busStops['timestamp']
            for i,busStop in enumerate(busStops['results']):
                stopId = busStop['stopid']
                busStopName = busStop['fullname']
                latitude = busStop['latitude']
                longitude = busStop['longitude']
                LUD = busStop['lastupdated']
                routes = busStop['operators'][0]['routes']
                flag = busStop['operators'][0]['name']

                cursor.execute('INSERT INTO main_dublinbusstops VALUES (%s, %s, %s, %s, %s, %s, %s, %s::text[], %s)',
                               (i,stopId,loadTime,busStopName,latitude,longitude,LUD,routes, flag)) # --- INSERT INTO TABLE
        else:
            raise JsonLoadError(busStops['errorcode']) # ---------------- IF the error code isn't '0' raise it
 
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
