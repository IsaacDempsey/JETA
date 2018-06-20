import requests # Get the contents from the url
from bs4 import BeautifulSoup # Scrape throgh the html content
import csv
records=[]


def my_parse(html,year):
    soup = BeautifulSoup(html, "html5lib")
    table = soup.find_all('table')[0]
    for i,tr in enumerate(table.find_all('tr')):
        if i == 0 and year=='2016':
            ths = tr.find_all('th')
        else:
            tds = tr.find_all('td')
            records.append([elem.text.encode('utf-8') for elem in tds])


def main():
    # ----------- URL for the scrapping the data
    years = ['2016','2017','index'] # ---------Index is for current year
    uri = "https://www.officeholidays.com/countries/ireland/"

    for year in years:
        try:
            url=uri+year+".php"
            response = requests.get(url)
            # Raise and check whats the status. Will except errors if the response is not 200 OK
            # response.raise_for_status()``
        except requests.exceptions.HTTPError as errh:
            print("Http Error:", errh)
        except requests.exceptions.ConnectionError as errc:
            print("Error Connecting:", errc)
        except requests.exceptions.Timeout as errt:
            print("Timeout Error:", errt)
        except requests.exceptions.RequestException as reqErr:
            print("Fatal Error: ", reqErr)

            try:
                html = response.content
                # print(html)
            except Exception as e:
                print("Except in reading html: ",e)
            else:
                my_parse(html,year)
            finally:
                try:
                    response.close()
                except (UnboundLocalError, NameError):
                    raise UnboundLocalError
        except Exception as e:
            print(e)
    
    # It's more efficient to write only once
    with open('holiday.csv', 'w', encoding='utf8', newline='') as f:
        writer = csv.writer(f)
        writer.writerows(records)

if __name__=="__main__":
    main()



