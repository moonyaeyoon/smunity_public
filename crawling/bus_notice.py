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

from datetime import datetime

def convertTime(timeString):
    return datetime.strptime(timeString, "%Y-%m-%d %H:%M:%S")

def getBusNotice(): 
    client = MongoClient("mongodb://localhost:27017/")
    noticeDB = client["school_notice"]
    noticeTable = noticeDB["bus_notice"]
    
    
    baseURL = f"https://topis.seoul.go.kr/notice/selectNoticeList.do"
    baseBody = {
        "pageIndex": 1,
        "recordPerPage": 10,
        "category": "sTtl",
        "boardSearch": "우회"
    }
    
    responseJsonString = requests.post(baseURL, data=baseBody, verify=False).content
    noticeDict = json.loads(responseJsonString)
    
    noticeTable.drop()
    
    for info in noticeDict["rows"]:
        number = info["bdwrSeq"]
        createdTime = convertTime(info["createDate"])
        updatedTime = convertTime(info['updateDate'])
        title = info['bdwrTtlNm']
        
        ContentSoup = bs(info["bdwrCts"], "html.parser")
        ContentText = ""
        
        # 이미지 링크 크롤링
        imgTags = ContentSoup.find_all("img")
        imgUrlList = []
        for img in imgTags:
            nowImageUrl =  '"https://' + img["src"][2:] + '"'
            imgUrlList.append(nowImageUrl)
        imgUrlListString = "[" +", ".join(imgUrlList) + "]"
        
        # 게시글 상세 내용 크롤링
        for nowTag in ContentSoup.children:
            if nowTag.text != "":
                    ContentText+=nowTag.text + "\n"
                
        noticeTable.insert_one({
            "number": number,
            "createdTime": createdTime,
            "updatedTime": updatedTime,
            "title": title,
            "imageUrlList": imgUrlListString,
            "content": ContentText
        })
        
    print("Crawling Done")
    
getBusNotice()
    
if __name__ == "__main__":
    getBusNotice()
    schedule.every().hour.do(getBusNotice)
    while True:
            schedule.run_pending()
            time.sleep(1)
