import requests as re
import json
import psycopg2


def main():
    """This program gets all the address that are around the dublin bus stop."""

    api_key = ''
    with open('./api_keys/googleMapApi.key', 'r') as fin:
        api_key = fin.read()
    # Google maps api url
    # https://maps.googleapis.com/maps/api/geocode/json?latlng=40.714224,-73.961452&key=AIzaSyD_5XUkLLoj_Xe6gyIreayAcrlP21_Nh88
    # url = "https: // maps.googleapis.com/maps/api/geocode/json?latlng="
    # Connect to the database
    url=''
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
        # ----------------------- Get the stop id, latitude and longitude in a tuple from the database

    except Exception as e:
        print("Database Issue: ", e)

    cursor.execute(
        "select stopid,lat,lng from main_dublinbusstops;")
    
    results = cursor.fetchall()
    for res in results:
        stopid=res[0]
        lat=str(res[1])
        lng=str(res[2])
        url = "https://maps.googleapis.com/maps/api/geocode/json?latlng=" + \
            lat+","+lng+"&key="+api_key
        # print(stopid+lat+lng)
        # print(url)
        try:
            # Raise and check whats the status. Will except errors if the response is not 200 OK
            response = re.get(url)
            addresses = json.loads(response.text)
            for address in addresses['results']:
                address_checker = address['formatted_address'].split(',')
                # Checking if the address is not generic for e.g., "Dublin, Ireland"
                if len(address_checker) > 3:
                    cursor.execute('INSERT INTO main_busstopaddress (stopid, address) VALUES (%s, %s)',
                                (stopid, address['formatted_address']))  # --- INSERT INTO TABLE
            # response.raise_for_status()
        except re.exceptions.HTTPError as errh:
            print("Http Error:", errh)
        except re.exceptions.ConnectionError as errc:
            print("Error Connecting:", errc)
        except re.exceptions.Timeout as errt:
            print("Timeout Error:", errt)
        except re.exceptions.RequestException as reqErr:
            print("Fatal Error: ", reqErr)
    conn.commit()
    cursor.close()  # ------------- Close the cursor
    conn.close()  # --------------- Close the connection
    print(url)

if __name__=="__main__":
    main()
