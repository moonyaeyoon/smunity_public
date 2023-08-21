# Python 3.8.10 - 64-bit

# pip3 install beautifulsoup4
# pip3 install requests
# pip3 install pymongo
# pip3 install schedule
# pip3 install google-cloud-vision

# DB - database name: school_notice
# DB - collection name: bus_notice
# DB - OCR collection name: ocr_history

import requests
from bs4 import BeautifulSoup as bs
from pymongo import MongoClient

import schedule
import time
import json

from datetime import datetime

from google.cloud import vision
import os

import urllib3 # ssl 연결 경고 무시하기
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

BUS_NUMBER_LIST = ["7016", "1711", "163", "서대문08", "종로13"]
BUS_NUMBER_SET = set(BUS_NUMBER_LIST)

def convertTime(timeString):
    return datetime.strptime(timeString, "%Y-%m-%d %H:%M:%S")

# set형을 json 배열의 문자열 형태로 반환
def setObject2JsonArrayString(setObject):
    newStringList = []
    for i in setObject:
        newStringList.append('"' + i + '"')
    return "[" + ", ".join(newStringList) + "]"

# json 배열의 문자열을 set형태로 반환
def jsonArrayString2SetObject(jsonString):
    listObjest = json.loads(jsonString)
    return set(listObjest)

# ocr 사진 다운로드하기
def downloadImage(url):
    print("Start OCR: ", url)
    imageName = url.split("/")[-1]
    imagePath = f"./{imageName}"
    img_data = requests.get(url, verify=False).content
    with open(imagePath, 'wb') as handler:
        handler.write(img_data)
        return imagePath

# ocr 사진 삭제하기  
def deleteImage(imagePath):
    os.remove(imagePath)

# ocr 요청하고 set으로 반환해주기
def detect_text(path):
    """Detects text in the file."""
    client = vision.ImageAnnotatorClient()

    with open(path, "rb") as image_file:
        content = image_file.read()

    image = vision.Image(content=content)

    response = client.document_text_detection(image=image)
    if response.error.message:
        raise Exception(
            "{}\nFor more info on error messages, check: "
            "https://cloud.google.com/apis/design/errors".format(response.error.message)
        )

    texts = response.text_annotations[0].description
    textsList = texts.split("\n")
    textSet = set(textsList)
    return textSet

# 실제 ocr전 과정
def googleOcrUrl(url):
    imagePath = downloadImage(url)
    resultSet = detect_text(imagePath)
    deleteImage(imagePath)
    return resultSet

# 해당 url이 db에 존재하면 set형, 없으면 None반환
def getHistoryFromDB(dbTable, url):
    dbResult = dbTable.find_one({"url": url})
    if dbResult != None:
        print("find History: ", url)
        return jsonArrayString2SetObject(dbResult['bus_number'])
    else: 
        return None

# db에 새로운 url 및 대응하는 set형으로 저장. TTL 추가 예정
def saveSetResult(dbTable, url, resultSet): 
    dbTable.insert_one({
        "url": url,
        "bus_number": setObject2JsonArrayString(resultSet)
    })

# url를 입력하고 set형을 반환하기
def getNumberSetFromUrl(urlTable, url):
    dbHistory = getHistoryFromDB(urlTable, url)
    if dbHistory == None:
        googleOcrResult = googleOcrUrl(url)
        matchedBusNumberSet = set(googleOcrResult) & BUS_NUMBER_SET
        saveSetResult(urlTable, url, matchedBusNumberSet)
        dbHistory = matchedBusNumberSet
    return dbHistory

def getBusNotice(): 
    client = MongoClient("mongodb://localhost:27017/")
    noticeDB = client["school_notice"]
    noticeTable = noticeDB["bus_notice"]
    ocrHistoryTable = noticeDB["ocr_history"]
    
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
            nowImageUrl =  'https://' + img["src"][2:]
            imgUrlList.append(nowImageUrl)
        imgUrlListString = setObject2JsonArrayString(imgUrlList)
        
        # 이미지 링크 OCR 돌리기
        BUS_NUMBER_OCR_RESULT = set()
        for imageUrl in imgUrlList:
            resultSet = getNumberSetFromUrl(ocrHistoryTable, imageUrl)
            BUS_NUMBER_OCR_RESULT = BUS_NUMBER_OCR_RESULT | resultSet
        busNumberOcrResultString = setObject2JsonArrayString(BUS_NUMBER_OCR_RESULT)
        print("OCR결과: ", busNumberOcrResultString)
            
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
            "content": ContentText,
            "bus_number_list": busNumberOcrResultString
        })
        print("==========")
        
    print("Crawling Done. Time:", datetime.now())

if __name__ == "__main__":
    getBusNotice()
    schedule.every().hour.do(getBusNotice)
    while True:
            schedule.run_pending()
            time.sleep(1)
