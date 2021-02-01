"""
script to display currently watching netflixshow in discord-rpc
"""

import requests
import time
from pypresence import Presence

class assets:
    HEADER = '\033[95m'
    OKBLUE = '\033[94m'
    OKCYAN = '\033[96m'
    OKGREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    BOLD = '\033[1m'
    UNDERLINE = '\033[4m'
    ENDC = '\033[0m'

try:
    with open("config.csv","r") as f:
        f = f.read().split("\n")
        f = f[1].split("|")
        shakti_ver = f[0]
        cookie = f[1]
        print(f"[{assets.OKGREEN}+{assets.ENDC}][{str(time.asctime()).split(' ')[-2]}] <cookie> and <api_version> extracted from config <{shakti_ver}>,<{cookie[0:10]}[...]>\n")
except:
	print("config.csv not found...")
	print("creating config.csv file...")
	print("requesting newest api version from /xNaCly/netflix-rpc/main/shakti")
	shakti = requests.get("https://raw.githubusercontent.com/xNaCly/netflix-rpc/main/shakti").text
	with open("config.csv","w") as f:
		f.write(f"shaktivver|cookie\n{shakti}|COOKIEPLACEHOLDER")
	print("created config.csv with newest api version, please replace <COOKIEPLACEHOLDER> with your cookie!")
	exit()


timer = int(time.time())
start1 = time.time()
RPC = Presence(740305744116580382)
RPC.connect()
print(f"[{assets.OKGREEN}+{assets.ENDC}][{str(time.asctime()).split(' ')[-2]}] connected to discord... [{round(time.time()-start1,2)}ms]")

headers={
        "cookie": cookie,
}

start = time.time()
info = requests.get(f"https://www.netflix.com/api/shakti/{shakti_ver}/profiles", headers=headers).json()["profiles"]
profiles = []

for profile in info:
    profiles.append(profile["firstName"].upper())

print(f"[{assets.OKGREEN}+{assets.ENDC}][{str(time.asctime()).split(' ')[-2]}] connected to netflix... [{round(time.time()-start,2)}ms]")
print(f"[:][{str(time.asctime()).split(' ')[-2]}] following profiles detected: ({', '.join(profiles)})\n")

while True:
    start = time.time()
    r = requests.get(f"https://www.netflix.com/api/shakti/{shakti_ver}/viewingactivity/", headers=headers).json()
    lastviewed = r["viewedItems"][0]
    keys = list(lastviewed.keys())

    if "seriesTitle" in keys:
        print(f"[{assets.OKGREEN}+{assets.ENDC}][{str(time.asctime()).split(' ')[-2]}] https://www.netflix.com/api/shakti/{shakti_ver}/viewingactivity/ {lastviewed['seriesTitle']}({lastviewed['title']})[{str(round(lastviewed['bookmark']/60))}/{str(round(lastviewed['duration']/60))}min] [{round(time.time()-start,2)}ms]")
        RPC.update(
            state=lastviewed["seriesTitle"],
            start=timer,
            large_image="logo",
            large_text=lastviewed["title"],
            small_image="logo",
            small_text=f"Progress: {str(round(lastviewed['bookmark']/60))}/{str(round(lastviewed['duration']/60))}min"
        )
    else:
        print(f"[{assets.OKGREEN}+{assets.ENDC}][{str(time.asctime()).split(' ')[-2]}] https://www.netflix.com/api/shakti/{shakti_ver}/viewingactivity/ {lastviewed['title']}({lastviewed['videoTitle']})[{str(round(lastviewed['bookmark']/60))}/{str(round(lastviewed['duration']/60))}min] [{round(time.time()-start,2)}ms]")
        RPC.update(
            state=lastviewed["title"],
            start=timer,
            large_image="logo",
            large_text=lastviewed["videoTitle"],
            small_image="logo",
            small_text=f"Progress: {str(round(lastviewed['bookmark']/60))}/{str(round(lastviewed['duration']/60))}min"
        )

    time.sleep(30)
