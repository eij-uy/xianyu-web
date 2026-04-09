import requests
import hashlib
import time
import json
import sys
import io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

from constants import USER_INFO_URL, LIST_MY_GOODS_URL, USER_ID_URL, REFRESH_TOKEN_URL

COOKIE_STR = None
APP_KEY = "34839810"

REQUEST_BODY_DICT = {
    USER_INFO_URL: {},
    USER_ID_URL: {},
    LIST_MY_GOODS_URL: {
        "needGroupInfo": True,
        "pageNumber": 1,
        "userId": "",
        "pageSize": 20
    },
    REFRESH_TOKEN_URL: {}
}


class XianYuCrawler:
    def __init__(self, cookie_str):
        if not cookie_str:
            raise ValueError("Cookie is required")
        self.cookies = self.parse_cookies(cookie_str)
        self.token = self.extract_token()
        self.session = self.create_session(cookie_str)

    def parse_cookies(self, cookie_str):
        cookies = {}
        for item in cookie_str.split(';'):
            item = item.strip()
            if '=' not in item:
                continue
            try:
                key, value = item.split('=', 1)
                cookies[key.strip()] = value
            except:
                pass
        return cookies

    def extract_token(self):
        if '_m_h5_tk' in self.cookies:
            return self.cookies['_m_h5_tk'].split('_')[0]
        return None

    def create_session(self, cookie_str):
        session = requests.Session()
        session.cookies.update(self.cookies)
        session.headers.update({
            'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Cookie': cookie_str,
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
            'Referer': 'https://2.taobao.com/',
            'Accept': 'application/json, text/plain, */*'
        })
        return session

    def generate_sign(self, href):
        if not self.token:
            raise ValueError("Token不存在")

        timestamp = int(time.time() * 1000)
        data_dict = REQUEST_BODY_DICT[href]
        data_json = json.dumps(data_dict, ensure_ascii=False, separators=(',', ':'))
        sign_str = f"{self.token}&{timestamp}&{APP_KEY}&{data_json}"
        sign = hashlib.md5(sign_str.encode('utf-8')).hexdigest()

        return sign, timestamp, data_json

    def get_params(self, href, sign, timestamp):
        return {
            'jsv': '2.7.2',
            'appKey': APP_KEY,
            't': str(timestamp),
            'sign': sign,
            'v': '1.0',
            'type': 'originaljson',
            'accountSite': 'xianyu',
            'dataType': 'json',
            'timeout': '20000',
            'api': 'mtop.taobao.idlemtopsearch.pc.search',
            'sessionOption': 'AutoLoginOnly',
        }

    def fetch_user_info(self):
        try:
            URL = USER_INFO_URL
            sign, timestamp, data_json = self.generate_sign(URL)
            params = self.get_params(URL, sign, timestamp)
            data = {'data': data_json}

            response = self.session.post(URL, params=params, data=data, timeout=30)
            json_data = response.json()
            
            return json_data.get("data", {})
        except Exception as e:
            return {"error": str(e)}

    def fetch_user_id(self):
        try:
            URL = USER_ID_URL
            sign, timestamp, data_json = self.generate_sign(URL)
            params = self.get_params(URL, sign, timestamp)
            data = {'data': data_json}

            response = self.session.post(URL, params=params, data=data, timeout=30)
            json_data = response.json()
            
            return json_data.get("data", {})
        except Exception as e:
            return {"error": str(e)}

    def fetch_page_data(self, page=1, limit=20):
        try:
            user_id_data = self.fetch_user_id()
            user_id = user_id_data.get('userId', '')

            
            REQUEST_BODY_DICT[LIST_MY_GOODS_URL]['pageNumber'] = page
            REQUEST_BODY_DICT[LIST_MY_GOODS_URL]['pageSize'] = limit
            REQUEST_BODY_DICT[LIST_MY_GOODS_URL]['userId'] = str(user_id)
            
            URL = LIST_MY_GOODS_URL
            sign, timestamp, data_json = self.generate_sign(URL)
            params = self.get_params(URL, sign, timestamp)
            data = {'data': data_json}


            response = self.session.post(URL, params=params, data=data, timeout=30)
            json_data = response.json()
            
            return json_data.get("data", {})
        except Exception as e:
            return {"error": str(e)}


def main():
    if len(sys.argv) < 3:
        print(json.dumps({"error": "Cookie is required as second argument"}, ensure_ascii=False))
        return
    
    cookie_str = sys.argv[2].strip('"')
    action = sys.argv[1] if len(sys.argv) > 1 else 'user_info'
    page = int(sys.argv[3]) if len(sys.argv) > 3 else 1
    limit = int(sys.argv[4]) if len(sys.argv) > 4 else 20
    
    crawler = XianYuCrawler(cookie_str)
    
    result = {}
    if action == 'user_info':
        result = crawler.fetch_user_info()
    elif action == 'user_id':
        result = crawler.fetch_user_id()
    elif action == 'page_data':
        result = crawler.fetch_page_data(page, limit)
    else:
        result = {"error": f"Unknown action: {action}"}
    
    print(json.dumps(result, ensure_ascii=False))


if __name__ == "__main__":
    main()