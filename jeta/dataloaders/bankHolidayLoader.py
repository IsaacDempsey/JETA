import psycopg2 # ----- To connect to the Database

def main():
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
        cursor = conn.cursor()
        f = open(r'C:\UCD\RESEARCH\Code\Final\jeta\dataloaders\holidays.csv', 'r')
        print(f)
        cursor.copy_from(f, 'main_bankholidays',columns=('day','date','holiday'), sep=",")
        f.close()
        conn.commit()
        cursor.close()
        conn.close()
    except Exception as e:
        print(e)

if __name__=="__main__":
    main()