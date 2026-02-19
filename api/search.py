from http.server import BaseHTTPRequestHandler
import urllib.parse
import json
import re
import ssl
import urllib.request
from collections import Counter

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        try:
            url_path = urllib.parse.urlparse(self.path)
            query_components = urllib.parse.parse_qs(url_path.query)
            ramen_name = query_components.get('q', [''])[0]
            
            if not ramen_name:
                self.send_response(400)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"error": "Missing query parameter 'q'"}).encode('utf-8'))
                return

            time_data = self.search_ramen_time(ramen_name)
            
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps(time_data).encode('utf-8'))
            
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"error": str(e)}).encode('utf-8'))

    def search_ramen_time(self, name):
        # Prepare request to Naver
        query = urllib.parse.quote(f"{name} 조리시간")
        url = f"https://search.naver.com/search.naver?query={query}"
        
        ctx = ssl.create_default_context()
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE
        
        req = urllib.request.Request(
            url, 
            headers={'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36'}
        )
        
        try:
            with urllib.request.urlopen(req, context=ctx) as response:
                html = response.read().decode('utf-8')
                
                # Heuristic: Find "X분" or "X분 Y초" patterns
                matches = re.finditer(r'(\d)\s*분\s*(?:(\d{1,2})\s*초)?', html)
                
                found_times = []
                for match in matches:
                    m = int(match.group(1))
                    s = int(match.group(2)) if match.group(2) else 0
                    
                    # Filter realistic ramen times (2 min to 6 min)
                    if 2 <= m <= 6:
                        found_times.append((m * 60) + s)
                
                if found_times:
                    most_common = Counter(found_times).most_common(1)
                    seconds = most_common[0][0]
                    
                    m = seconds // 60
                    s = seconds % 60
                    
                    desc = f"{m}분"
                    if s > 0:
                        desc += f" {s}초"
                        
                    return {
                        "found": True,
                        "name": name,
                        "time": seconds,
                        "desc": desc,
                        "tip": "웹 검색을 통해 찾은 조리시간입니다."
                    }
                
                return {"found": False}
                
        except Exception as e:
            return {"found": False, "error": str(e)}
