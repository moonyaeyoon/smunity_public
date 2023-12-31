# Python 3.8.10 - 64-bit

# pip3 install beautifulsoup4
# pip3 install requests
# pip3 install pymongo
# pip3 install schedule

# DB - database name: school_notice
# DB - collection name: seoul_new_100

import requests
from bs4 import BeautifulSoup as bs
from pymongo import MongoClient

import schedule
import time
from datetime import datetime

def getSchoolNotice(): 
    client = MongoClient("mongodb://localhost:27017/")
    noticeDB = client["school_notice"]
    noticeTable = noticeDB["seoul_new_100"]

    campus = "smu" #천안캠은 smuc
    page = requests.get(f'https://www.smu.ac.kr/kor/life/notice.do?srUpperNoticeYn=on&srCampus={campus}&article.offset=0&articleLimit=100')

    soup = bs(page.content, "html.parser")

    table_tag = soup.find('ul', class_="board-thumb-wrap")
    noticeList = table_tag.find_all("dl")

    noticeTable.drop()

    for i in noticeList:
        NOW_TITLE = i.dt.table.tbody.find_all("td")[2].text.replace("\t", "").replace("\r", "").replace("\n", "")
        NOW_INDEX = i.dd.ul.find_all('li')[0].text.replace("\t", "").replace("\r", "").replace("\n", "").replace("No.", "")
        # NOW_AUTHOR = i.dd.ul.find_all('li')[1].text.replace("\t", "").replace("\r", "").replace("\n", "").replace("작성자", "")
        NOW_DATE = i.dd.ul.find_all('li')[2].text.replace("\t", "").replace("\r", "").replace("\n", "").replace("작성일", "")
        SITE_DATE_LIST = NOW_DATE.split('-')
        SERVER_TIME = f'{SITE_DATE_LIST[0]}.{SITE_DATE_LIST[1]}.{SITE_DATE_LIST[2]}_00:00:00' # 2023.04.02_01:06:23
        NOW_VIEWS = i.dd.ul.find_all('li')[3].text.replace("\t", "").replace("\r", "").replace("\n", "").replace("조회수", "")
        noticeTable.insert_one({
            "title": NOW_TITLE,
            "index": NOW_INDEX,
            "date": SERVER_TIME,
            "views": NOW_VIEWS
        })
    print("Crawling Done. Time:", datetime.now())
    
if __name__ == "__main__":
    getSchoolNotice()
    schedule.every().hour.do(getSchoolNotice)
    while True:
            schedule.run_pending()
            time.sleep(1)
