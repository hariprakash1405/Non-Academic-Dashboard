import json
import urllib.request

with open('test_new_grouping.json', 'r') as f:
    menu_data = f.read()

payload = {
    "blockName": "Boys Hostel",
    "monthYear": "2026-03",
    "menuJSON": menu_data
}

req = urllib.request.Request('http://localhost:8085/api/mess/menu', data=json.dumps(payload).encode('utf-8'), headers={'Content-Type': 'application/json'})
try:
    with urllib.request.urlopen(req) as response:
        print(response.read().decode('utf-8'))
except Exception as e:
    print(e)
