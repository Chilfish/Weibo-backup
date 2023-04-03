import requests
import re
import os
import argparse

parser = argparse.ArgumentParser(formatter_class=argparse.RawDescriptionHelpFormatter)
parser.add_argument('-u', '--uid', type=str, help='用户UID')
parser.add_argument('-p', '--imgsPath', type=str, help='图片列表路径')

args = parser.parse_args()

referer = f'https://weibo.com/u/{args.uid}'
imgs_path = os.path.join(args.imgsPath, "imgs-lists.txt")
download_folder = 'assets/'

if not os.path.exists(download_folder):
    os.makedirs(download_folder)

with open(imgs_path, 'r', encoding='utf-8') as file:
    text = file.read()
    url_list = text.split(',\n')


def download_file(url, file_path):
    headers = {'Referer': referer}
    response = requests.get(url, headers=headers)
    with open(file_path, 'wb') as f:
        f.write(response.content)

for url in url_list:
    try:
        file_name = url.split('/')[-1]
        match = re.search(r"(.+)\.(jpg|png|gif|webp|jpeg)", file_name)
        file_name = match.group(1) + '.' + match.group(2)

        file_path = os.path.join(download_folder, file_name)
        if not os.path.exists(file_path):
            download_file(url, file_path)
    except Exception as e:
        print(e)

print("Done!")