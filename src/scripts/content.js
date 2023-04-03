(async function () {
  ('use strict');
  const $ = jQuery;

  let id;
  let uid;
  let username;

  const prefix = `https://weibo.com`;
  const GetPostsURL = `https://weibo.com/ajax/statuses/mymblog`;

  let page = 1;
  let cnt = 0;
  let since_id = '';
  let total = 0;
  let count = 0;
  let loadMore = true;

  // 是否手动暂停
  let forcePause = false;

  // 拉取间隔时间
  let interval = 1000;

  // 上一次拉取时间
  let lastFetchTimeStamp = 0;

  const body = $('body');
  let $progressCount;
  let $progressBar;
  let $speechlessList;
  let $speechlessPanel;
  let $speechlessMain;

  let wholeHTML = ``;
  let imgsList = [];

  const emojiMap = new Map();
  emojiMap.set('default', '🤐');
  emojiMap.set('fetching', '🤯');
  emojiMap.set('done', '🤖');

  // 使用 Weibo API 获取用户 UID 和用户名
  const getInfo = function () {
    id = getIDFromURL();
    if (!id) return;

    $.ajax({
      async: false,
      type: 'GET',
      url: `https://weibo.com/ajax/profile/info?custom=${id}`,
      success: function (data) {
        uid = data.data.user.id;
        username = data.data.user.screen_name;

        console.log({ uid, username });
      },
    });
  };

  // 从 URL 中获取 ID，注意不是 UID
  const getIDFromURL = function () {
    let id;
    let url = location.href;
    let regRes = url.match(/weibo.com\/(u\/)*(\w+)/);
    if (regRes && regRes.length > 1) {
      id = regRes.pop();
    }
    console.log('id from url is: ', id);
    return id;
  };

  const delay = function (timeout) {
    return new Promise((resolve, reject) => {
      setTimeout(resolve, timeout);
    });
  };

  // 声明fetch方法
  const fetchData = async function (config) {
    let url = config.url;
    let param = config.parameters || {};

    let offset = parseInt(new Date().valueOf()) - lastFetchTimeStamp;
    if (offset < interval) {
      let delayMS = interval - offset;
      await delay(delayMS);
    }

    return new Promise((resolve, reject) => {
      let method = config.method || 'get';
      lastFetchTimeStamp = parseInt(new Date().valueOf());
      $.ajax({
        type: method.toUpperCase(),
        url,
        data: param,
        success: function (response) {
          resolve(response.data);
        },
        error: function (error) {
          console.error(error);
          reject(error);
        },
      });
    });
  };

  // 格式化时间
  const getDate = function (dateString, showSecond) {
    let date = new Date(dateString);
    let hour = date.getHours();
    let minute = date.getMinutes();
    let second = date.getSeconds();
    let year = date.getFullYear();
    let month = date.getMonth() + 1;
    let day = date.getDate();

    const fillWithZero = (num) => {
      if (parseInt(num) < 10) {
        return '0' + num.toString();
      } else return num.toString();
    };
    return (
      year +
      '/' +
      fillWithZero(month) +
      '/' +
      fillWithZero(day) +
      ' ' +
      fillWithZero(hour) +
      ':' +
      fillWithZero(minute) +
      (showSecond ? ':' + fillWithZero(second) : '')
    );
  };

  const pic_preview = function () {
    const $$ = (e) => document.querySelectorAll(e);
    const bodyWidth = document.body.clientWidth;

    const mask = $('div.img-mask');
    const img_preview = $('div.img-mask img');

    $$('img.image').forEach((ele) => {
      ele.onclick = (e) => {
        img_preview.src = e.target.currentSrc;
        img_preview.style.maxWidth = (img_preview.width / bodyWidth) * 100;

        mask.classList.toggle('hidden');
        mask.onclick = (e) => {
          if (e.target === mask) {
            mask.classList.toggle('hidden');
            img_preview.src = '';
          }
        };
      };
    });

    img_preview.onclick = () => {
      img_preview.classList.toggle('zoomIn');
    };
  };

  // 切换顶部的emoji
  const switchEmoji = function (state) {
    if (!state) state = 'default';
    $('.speechless-logo').text(emojiMap.get(state));
  };

  // 过滤多余的换行
  const clearLineBreak = function (text) {
    return text.replace(/\n/g, '<br/>').replace(/(<br\s?\/>)+/g, '<br/>');
  };

  // 每添加一个卡片，就要更新一次页面的状态
  const updateWholePageState = function () {
    count++;
    setProgress();
  };

  // 返回图片列表
  const getPic = function (infos, num) {
    if (!num) return '';

    let pics = `<div class="media">`;
    for (const [key, value] of Object.entries(infos)) {
      let img = value.largest.url;
      imgsList.push(img);
      pics += `<div class="img-box"><img class="image" src="${img}"/></div>
      `;
    }
    return pics + '</div>';
  };

  // fetch 长文本
  const getLong = async function (id) {
    const reqParam = {
      url: `https://weibo.com/ajax/statuses/longtext`,
      parameters: {
        id,
      },
    };
    try {
      let longTextData = await fetchData(reqParam);
      return longTextData.longTextContent || '';
    } catch (err) {
      console.error(err);
    }
  };

  // 获取评论区
  const getComment = async function (id) {
    const param = {
      url: `https://weibo.com/ajax/statuses/buildComments`,
      parameters: {
        id,
        is_show_bulletin: 0,
      },
    };
    try {
      const commentData = await fetchData(param);
      if (!commentData.length) return '';

      let commentHTML = '<div class="comment">';

      commentData.forEach((comment) => {
        commentHTML += `
        <div>
          <a href="${prefix}${comment.user.profile_url}" target="_blank">@${comment.user.screen_name}</a>
          <span class="text">${clearLineBreak(comment.text)}</span>
          <div class="date">${getDate(comment.created_at)}</div>
        </div>`;
      });
      return commentHTML + '</div>';
    } catch (err) {
      console.error(err);
    }
  };

  // 把卡片添加到页面中
  const appendHTML = async function (post) {
    let metaHTML = `<span class="date">${getDate(post.created_at)}</span>`;
    if (post.region_name) {
      metaHTML += `<span class="region">${post.region_name}</span>`;
    }

    // 获取长文
    if (!!post.isLongText) {
      post.text = await getLong(post.mblogid);
    }

    let textHTML = `<p>${clearLineBreak(post.text)}</p>`;

    const subst = `<a href="${prefix}$1" target="_blank">`;
    textHTML = textHTML.replace(/<a href=(\/n\/[\u4e00-\u9fa5a-zA-Z0-9_-]+)>/gm, subst);

    let mediaHTML = getPic(post.pic_infos, post.pic_num);

    let retweetHTML = '';
    // 转发微博
    if (post.retweeted_status && post.retweeted_status.user) {
      const retweet = post.retweeted_status;
      let text = retweet.text;

      if (!!retweet.isLongText) {
        text = await getLong(retweet.mblogid);
      }

      const imgs = getPic(retweet.pic_infos, retweet.pic_num);

      retweetHTML += `<div class="retweet">
        <a class=username href="${prefix}${retweet.user.profile_url}" target="_blank">
          @${retweet.user.screen_name}
        </a>
        <span style="margin:0 3px;">:</span>
        <p>${clearLineBreak(text)}</p>
        ${imgs}
      </div>`;
    }
    // 转发了卡片
    else if (post.page_info) {
      const card = post.page_info;
      const card_info = {
        title: card.page_title,
        url: card.page_url,
        pic: card.page_pic,
      };
      imgsList.push(card_info.pic);

      let url = decodeURIComponent(card_info.url);
      if (url.indexOf('share.b23.tv') !== -1) {
        url = url.match(/https:\/\/share\.b23\.tv\/(BV[\w\d]+)/gm)[0];
      }

      retweetHTML = `
      <a class="card" href="${url}" target="_blank">
        <img src="${card_info.pic}">
        <p>${card_info.title}</p>
      </a>`;
    }

    const commentHTML = await getComment(post.mid);

    let postHTML = `
      <div class="post"> 
        <div class="meta">${metaHTML}</div>
        <main>
          ${textHTML}
          ${mediaHTML}
          ${retweetHTML}
          ${commentHTML}
        </main>
      </div>
      `;

    wholeHTML += postHTML;
    updateWholePageState();
  };

  // 初始化面板
  const initThePanel = function (uid) {
    if (!$speechlessPanel) {
      body.append(`<div class="speechless">
              <div class="speechless-head">
                <span class="speechless-logo">🤐</span>
                <div class="speechless-title">Speechless</div>
              </div>
              <div class="speechless-main"></div>
            </div>`);
      $speechlessPanel = $('.speechless');
      $speechlessMain = $('.speechless-main');
    }
    $speechlessMain.html('');

    if (!uid) {
      $speechlessMain.append(`😵‍💫 请进入个人主页，刷新页面后使用`);
    } else {
      $speechlessMain.append(`
        <div class="speechless-action">
          <span class="speechless-tips">📦 把<span class="speechless-username">@${username}</span>的记忆打包...</span>
          <div id="speechless-wait"></div>
          <div class="input"><div>
              <span>从第</span>
              <input type="number" id="speechless-begin" min="0" max="1000" value="0">
              <span>页开始</span></div>
            <span class="speechless-button" id="doSpeechless">开始</span>
          </div>
        </div>`);
      $speechlessMain.append(`
        <div class="speechless-fetching" style="display:none;">
          <div class="item-center content-between">
            <span class="speechless-tips">📡 正在努力回忆中...</span>
          </div>
          <div class="speechless-progress">
            <div class="speechless-progress-bar"></div>
          </div>
          <div class="item-center content-between speechless-interact">
            <span class="speechless-count">0/0</span>
            <span class=" speechless-button blue" id="doForcePause">暂停</span>
            <span class=" speechless-button blue" id="doPreview">预览</span>
            <span class=" speechless-button blue" id="exportFile">分页</span>
            <span class=" speechless-button blue" id="exportImgs">图片链接</span>
          </div>
        </div>`);
      $speechlessMain.append(`
        <div class="speechless-done" style="display:none;">
          <div class="item-center content-between">
            <span class="speechless-tips">🖨 只能回想起这么多了...</span>
          </div>
        </div>`);
    }

    $progressCount = $('.speechless-count');
    $progressBar = $('.speechless-progress-bar');

    $(document).on('click', '#doSpeechless', async () => {
      $('#speechless-wait').text('🤐 请稍等，正在努力加载中...');
      page = $('#speechless-begin').val();
      Start();
    });

    $(document).on('click', '#exportFile', () => {
      exportFile();
      forcePause = true;
    });

    $(document).on('click', '#exportImgs', () => {
      saveText(imgsList.join(',\n'), `imgs-lists.txt`);
    });

    $(document).on('click', '#doPreview', () => putHTML());

    $(document).on('click', '#doForcePause', function (e) {
      forcePause = !forcePause;
      $(this).text(forcePause ? '继续' : '暂停');
      if (!forcePause) {
        fetchPost();
      }
    });

    const toggleClass = (status, className) => {
      if (status) {
        $speechlessList.addClass(className);
      } else {
        $speechlessList.removeClass(className);
      }
    };

    $(document).on('change', '#ifCropImage', function () {
      toggleClass(this.checked, 'cropimage');
    });

    $(document).on('change', '#ifShowInteraction', function () {
      toggleClass(this.checked, 'showinteraction');
    });
  };

  const Start = async function () {
    if (!page) {
      page = 1;
      mainFetch();
      return;
    }

    count = page * 100;
    cnt = page;
    page *= 5;

    const data = await fetchData({
      url: GetPostsURL,
      parameters: {
        uid,
        page: page - 1,
        since_id,
        feature: 0,
      },
    });

    since_id = data.since_id;
    total = data.total;
    if (page > total / 20) {
      $('#speechless-wait').text('😵‍💫 你的记忆太少了，没有这么多页');
      return;
    }

    $('#speechless-wait').text('');
    mainFetch();
  };

  // 开始拉取时，面板的状态
  const beginToFetch = function () {
    $('.speechless').css({ top: '25px' });
    $('.speechless-action').hide();
    $('.speechless-done').hide();
    $('.speechless-fetching').show();
    switchEmoji('fetching');
  };

  // 拉取完成时，面板的状态
  const checkIfFinished = function () {
    if (forcePause) return false;
    $('.speechless-action').hide();
    $('.speechless-fetching').hide();
    $('.speechless-done').show();
    switchEmoji('done');
    return true;
  };

  // 更新进度条
  const setProgress = function () {
    let countString = `${count}/${total}`;
    $progressCount.text(countString);
    let percent = Number((count * 100) / total);
    $progressBar.width(`${percent}%`);
  };

  // 清空页面上的多余元素
  const clearTheBody = function () {
    $('body').append(`<div class="speechless-list cropimage"></div>`);
    $speechlessList = $('.speechless-list');
  };

  const putHTML = function () {
    $('.WB_miniblog').empty();
    $('#WB_webchat').empty();

    $('#app').html(`<div class="list">${wholeHTML}</div>`);
  };

  // 主要的拉取逻辑
  const mainFetch = async function () {
    beginToFetch();
    clearTheBody();
    await fetchPost();
  };

  // save Text as file
  const saveText = function (text, file) {
    const blob = new Blob([text], { type: 'text/html' });
    const link = document.createElement('a');
    link.download = file;
    link.href = URL.createObjectURL(blob);
    link.click();
    URL.revokeObjectURL(link.href);
  };

  // 导出文件
  const exportFile = function () {
    wholeHTML = `<!DOCTYPE html>
      <html lang="en">
      <head>
        <meta http-equiv="content-type" content="text/html; charset=UTF-8">
        <meta charset="utf-8">
        <link rel="dns-prefetch" href="http://h5.sinaimg.cn/">
        <meta name="viewport" content="width=device-width,initial-scale=1,user-scalable=no,viewport-fit=cover">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <meta http-equiv="Content-Security-Policy" content="upgrade-insecure-requests">
        <link rel="icon" href="https://weibo.com/favicon.ico">
        <link rel="stylesheet" href="/index.css">
        <script defer src="/index.js"></script>
        <title>Weibo backup</title>
      </head>
      <body>
        <div class="list">${wholeHTML}</div>
        <div class="img-mask hidden"><img class="preview" src=""></div>
      </body>
    </html>`;

    wholeHTML = wholeHTML
      .replace(/https?:\/\/.+sinaimg.cn\/large\/(.+)/gm, `/assets/$1`)
      .replace(/https?:\/\/.+\/bfs\/archive\/(.+)/gm, `/assets/$1`);

    saveText(wholeHTML, `weibo-backup_${cnt}.html`);
    cnt++;
    wholeHTML = '';
  };

  // 获取所有的微博
  const fetchPost = async function () {
    while (loadMore && !forcePause) {
      try {
        let data = await fetchData({
          url: GetPostsURL,
          parameters: {
            uid,
            page,
            since_id,
            feature: 0,
          },
        });
        page++;
        since_id = data.since_id;
        if (total === 0) {
          total = data.total;
        }
        loadMore = !!data.since_id;

        for (let post of data.list) {
          if (post.user.id != uid) continue;
          await appendHTML(post);
        }
      } catch (err) {
        console.error(err);
      } finally {
        // 每 5 页导出一次
        if (page % 5 === 0) {
          console.log('exported', cnt);
          exportFile();
          await delay(1000);
        }
      }
    }

    if (checkIfFinished()) {
      exportFile();
    }
  };

  const init = function () {
    getInfo();
    initThePanel(uid);
    pic_preview();
  };
  init();
})();
