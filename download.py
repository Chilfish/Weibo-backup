import requests
import re
import os
import argparse

parser = argparse.ArgumentParser(formatter_class=argparse.RawDescriptionHelpFormatter)
parser.add_argument('-u', '--uid', type=str, help='用户ID')
parser.add_argument('-d', '--dir', type=str, help='下载目录')
parser.add_argument('-p', '--imgsPath', type=str, help='图片列表路径')

args = parser.parse_args()

args.imgsPath = 'D:/Download'
referer = f'https://weibo.com/u/{args.uid}'
download_folder = args.dir

if not os.path.exists(download_folder):
    os.makedirs(download_folder)

def download_file(url, referer, file_path):
    headers = {'Referer': referer}
    response = requests.get(url, headers=headers)
    with open(file_path, 'wb') as f:
        f.write(response.content)


with open(f"{args.imgsPath}/imgs-lists.txt", 'r', encoding='utf-8') as file:
    text = file.read()
    url_list = text.split(',\n')

for url in url_list:
    file_name = url.split('/')[-1]
    try:
        match = re.search(r"(.+)\.(jpg|png|gif|webp|jpeg)", file_name)
        file_name = match.group(1) + '.' + match.group(2)
    except Exception as e:
        print(e)

    file_path = os.path.join(download_folder, file_name)
    if not os.path.exists(file_path):
        download_file(url, referer, file_path)

print("Done!")