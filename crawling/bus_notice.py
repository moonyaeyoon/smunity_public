# Python 3.8.10 - 64-bit

# pip install beautifulsoup4
# pip install requests
# pip install pymongo
# pip install schedule

# DB - database name: school_notice
# DB - collection name: bus_notice

import requests
from bs4 import BeautifulSoup as bs
from pymongo import MongoClient

import schedule
import time
import json

import certifi
import ssl
from datetime import datetime

def convertTime(timeString):
    return datetime.strptime(timeString, "%Y-%m-%d %H:%M:%S")

def analyzePost(title, content, createdTime, editedTime):
    pass # TODO: 하나의 게시물을 분석하면서 필요한 내용이 있으면 반환, 없으면 패스

def saveToDB(goodPosts):
    pass #TODO: 배열으로 된 게시물들을 DB에 추가하는 부분. DB 구조 설계 필요. 이전 데이터 삭제 필요


def getBusNotice(): 
    client = MongoClient("mongodb://localhost:27017/")
    noticeDB = client["school_notice"]
    noticeTable = noticeDB["bus_notice"]
    
    baseURL = f"http://topis.seoul.go.kr/notice/selectNoticeList.do?pageIndex=1&recordPerPage=10&pageSize=5&jsFunction=fn_getNoticeList&bdwrSeq=&blbdDivCd=02&bdwrDivCd=0202&tabGubun=B&category=sTtl&boardSearch="
    responseJsonString = requests.post(baseURL, verify=False).content
    noticeDict = json.loads(responseJsonString)
    for info in noticeDict["rows"]:
        createdTime = convertTime(info["createDate"])
        editedTime = convertTime(info['updateDate'])
        title = info['bdwrTtlNm']
        
        soup = bs(info["bdwrCts"], "html.parser")
        
        print(soup.find_all('img'))
        
        
    
    # soup = bs(response, 'html.parser')

    # table_tag = soup.find('ul', class_="board-thumb-wrap")
    # noticeList = table_tag.find_all("dl")

    # noticeTable.drop()

    # for i in noticeList:
    #     NOW_TITLE = i.dt.table.tbody.find_all("td")[2].text.replace("\t", "").replace("\r", "").replace("\n", "")
    #     NOW_INDEX = i.dd.ul.find_all('li')[0].text.replace("\t", "").replace("\r", "").replace("\n", "").replace("No.", "")
    #     # NOW_AUTHOR = i.dd.ul.find_all('li')[1].text.replace("\t", "").replace("\r", "").replace("\n", "").replace("작성자", "")
    #     NOW_DATE = i.dd.ul.find_all('li')[2].text.replace("\t", "").replace("\r", "").replace("\n", "").replace("작성일", "")
    #     SITE_DATE_LIST = NOW_DATE.split('-')
    #     SERVER_TIME = f'{SITE_DATE_LIST[0]}.{SITE_DATE_LIST[1]}.{SITE_DATE_LIST[2]}_00:00:00' # 2023.04.02_01:06:23
    #     NOW_VIEWS = i.dd.ul.find_all('li')[3].text.replace("\t", "").replace("\r", "").replace("\n", "").replace("조회수", "")
    #     noticeTable.insert_one({
    #         "title": NOW_TITLE,
    #         "index": NOW_INDEX,
    #         "date": SERVER_TIME,
    #         "views": NOW_VIEWS
    #     })
    print("Crawling Done")
    
getBusNotice()
    
# if __name__ == "__main__":
#     getBusNotice()
#     schedule.every().hour.do(getBusNotice)
#     while True:
#             schedule.run_pending()
#             time.sleep(1)
