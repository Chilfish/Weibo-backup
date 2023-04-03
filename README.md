# Speechless

![image](https://raw.iqiq.io/Chilfish/Weibo-backup/main/medias/Small%20promo%20tile.png)

Speechless 是一个帮助新浪微博用户，把微博内容导出成 HTML 进行本地备份的 Extension。

## 使用

下载插件包本地载入： [Release](https://github.com/Chilfish/Weibo-backup/releases)

- **火狐用户：** 火狐可以直接在 `about:addons` 页面中将 zip 拖进去
- **Chrome 或 Edge** 等 Chromium 用户：则需要先将 zip 解压再在拓展管理页中加载解压的文件夹
- **油猴脚本**：可以直接加载 Release 下的 [Weibo-backup.user.js](https://github.com/Chilfish/Weibo-backup/raw/main/Weibo-backup.user.js)

选择 （导出）图片链接后，会有一个包含微博里所有原图的 `imgs-lists.txt`，需要用 [Download.py](https://github.com/Chilfish/Weibo-backup/blob/main/download.py) 来下载他们

需要注意的是，这是以每 100 条微博分页导出的，也能手动先暂停，等它停下来后选择 **分页** 来将该部分导出

> 由于每次循环他都是以 20 条微博为单位分页的，所以点击暂停时，并不会立刻暂停，而是会等到这 20 条队列的完成

## 简介

![ScreenShots-1](https://raw.iqiq.io/Chilfish/Weibo-backup/main/medias/ScreenShots-1.png)

![ScreenShots-2](https://raw.iqiq.io/Chilfish/Weibo-backup/main/medias/ScreenShots-2.png)

![ScreenShots-4](https://raw.iqiq.io/Chilfish/Weibo-backup/main/medias/ScreenShots-4.png)

**更改后的样式：**

![img](https://raw.iqiq.io/Chilfish/Weibo-backup/main/medias/3.png)

![img](https://raw.iqiq.io/Chilfish/Weibo-backup/main/medias/1.png)

![img](https://raw.iqiq.io/Chilfish/Weibo-backup/main/medias/2.png)

## 功能

所以 Speechless 做了以下几件事情：

1. 在页面上找到需要备份用户的 UID，这通常可以通过 URL 直接获得
2. 通过 Ajax 不断去拉取该用户可见的微博内容，当内容中有长文时，额外通过接口获取长文信息
3. 同时也支持 普通转发、卡片式转发、多图、@ 用户等的跳转
4. 将拉取到的微博内容，添加到页面的节点上，并且设置基本的样式和布局
5. 其中，会将里面出现的所有图片以原图链接的形式，导出到 imgs-lists.txt 中，再用 [download.py](https://github.com/Chilfish/Weibo-backup/blob/main/download.py) 下载里面的原图
6. 在爬取的过程中，将以每 100 条微博作为分页间隔，自动导出 HTML
7. 可以指定开始的页数，并请等待几秒，让它获取到该页的数据
8. 同时能随时预览当前页数微博的导出样式
9. 最后，点击 **分页链接** 将导出图片链接

实测基本每条微博的爬取为 1 秒左右，主要耗费在了获取转发的内容和获取多图

## 依赖

- [jQuery](https://github.com/jquery/jquery)

## 其他

- 愿人人都有自由表达的权利。

## 更新

### version 2.0

- 更改了基本样式，使其更加美观
- 添加了分页功能，和下载微博原图
- 添加了诸如普通转发、卡片转发、评论区等功能
- 可以指定爬取的起始页数（每页 100 条微博）

### version 1.2

- 增加了默认的拉取时间间隔，以避免拉取过于频繁被微博限制的问题。但目前的方法仍不是最优解法，尚有较大优化空间
- 增加了拉取完成后，手动选择图片裁切样式的操作
- 增加了拉取完成后，手动选择是否展示 转、赞、评 信息的操作 [@rickypeng99](https://github.com/rickypeng99)
- 增加了拉取过程中暂停的操作

### version 1.1

- 使用 Weibo API 获取用户 UID 和用户名 [@jingfelix](https://github.com/jingfelix)
- 修复了 icon name 错误的大小写问题 [@jjhhms](https://github.com/jjhhms)
