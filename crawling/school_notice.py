# Python 3.8.10 - 64-bit
# pip install beautifulsoup4
# pip install requests
# pip install pymongo
# DB - database name: school_notice
# DB - collection name: seoul_new_100

import requests
from bs4 import BeautifulSoup as bs
from pymongo import MongoClient

client = MongoClient("mongodb://localhost:27017/")

noticeDB = client["school_notice"]
noticeTable = noticeDB["seoul_new_100"]

campus = "smu" #천안캠은 smuc
page = requests.get(f'https://www.smu.ac.kr/lounge/notice/notice.do?srUpperNoticeYn=on&srCampus={campus}&article.offset=0&articleLimit=100')

soup = bs(page.content, "html.parser")

table_tag = soup.find('ul', class_="board-thumb-wrap")
noticeList = table_tag.find_all("dl")

noticeTable.drop()

for i in noticeList:
    NOW_TITLE = i.dt.table.tbody.find_all("td")[2].text.replace("\t", "").replace("\r", "").replace("\n", "")
    NOW_INDEX = i.dd.ul.find_all('li')[0].text.replace("\t", "").replace("\r", "").replace("\n", "").replace("No.", "")
    # NOW_AUTHOR = i.dd.ul.find_all('li')[1].text.replace("\t", "").replace("\r", "").replace("\n", "").replace("작성자", "")
    NOW_DATE = i.dd.ul.find_all('li')[2].text.replace("\t", "").replace("\r", "").replace("\n", "").replace("작성일", "")
    NOW_VIEWS = i.dd.ul.find_all('li')[3].text.replace("\t", "").replace("\r", "").replace("\n", "").replace("조회수", "")
    noticeTable.insert_one({
        "title": NOW_TITLE,
        "index": NOW_INDEX,
        "date": NOW_DATE,
        "views": NOW_VIEWS
    })
    