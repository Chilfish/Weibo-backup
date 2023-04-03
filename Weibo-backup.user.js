// ==UserScript==
// @name            Weibo-backup
// @namespace       https://github.com/Chilfish/Weibo-backup
// @version 0.1.0
// @description     把新浪微博的内容，导出成 HTML 文件进行备份
// @description:en  Export the content of Sina Weibo as an HTML file for backup.
// @author          https://github.com/Chilfish/
// @icon            https://fastly.jsdelivr.net/gh/Chilfish/Weibo-backup@main/src/icons/Speechless32.png
// @match           https://weibo.com/*
// @require         https://cdn.bootcdn.net/ajax/libs/jquery/3.6.4/jquery.min.js
// @require         https://fastly.jsdelivr.net/gh/Chilfish/Weibo-backup@main/src/scripts/content.js
// @grant           GM.setValue
// @grant           GM.getValue
// @grant           GM_xmlhttpRequest
// @license         MIT
// ==/UserScript==

(function () {
  const style = document.createElement('style');
  style.type = 'text/css';

  const cssUrl = 'https://fastly.jsdelivr.net/gh/Chilfish/Weibo-backup@main/src/style/speechless.css';

  fetch(cssUrl)
    .then((response) => response.text())
    .then((css) => {
      style.innerHTML = css;
      document.head.appendChild(style);
    });
})();
