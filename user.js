// ==UserScript==
// @name          推流码全参数捕获器
// @namespace    http://tampermonkey.net/
// @version      1.2
// @description  捕获 RTMPS 推流地址和参数
// @author       GPT
// @match        *://*/*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    function extractRawRtmpsWithEscapes(text) {
        const regex = /rtmps:\/\/[^"'\\\s]+(?:\\u0026[^"'\\\s]+)*/g;
        const matches = text.match(regex);
        if (matches && matches.length > 0) {
            const uniqueMatches = [...new Set(matches)];
            uniqueMatches.forEach(fullRawUrl => {
                const fullUrl = fullRawUrl.replace(/\\u0026/g, "&");
                splitAndShow(fullUrl);
            });
        }
    }

    const origFetch = window.fetch;
    window.fetch = async function (...args) {
        const response = await origFetch.apply(this, args);
        try {
            const clone = response.clone();
            const text = await clone.text();
            extractRawRtmpsWithEscapes(text);
        } catch (e) {
            console.warn("fetch 捕获失败:", e);
        }
        return response;
    };

    const origOpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function (...args) {
        this.addEventListener("load", function () {
            try {
                extractRawRtmpsWithEscapes(this.responseText);
            } catch (e) {
                console.warn("XHR 捕获失败:", e);
            }
        });
        return origOpen.apply(this, args);
    };

    function splitAndShow(fullUrl) {
        try {
            const urlObj = new URL(fullUrl);
            const pathname = urlObj.pathname;
            const pathParts = pathname.split("/");
            const streamKey = pathParts.pop() + urlObj.search;
            const server = fullUrl.replace(pathname + urlObj.search, "") + pathname.substring(0, pathname.lastIndexOf("/") + 1);
            console.log("✅ RTMP 推流地址捕获成功！");
            console.log("📡 服务器地址：", server);
            console.log("🔑 推流码（Stream Key）：", streamKey);
            showNotification(server, streamKey);
        } catch (err) {
            console.warn("解析 URL 失败:", err, fullUrl);
        }
    }

    function showNotification(server, key) {
        let div = document.getElementById("rtmps-notice");
        if (!div) {
            div = document.createElement("div");
            div.id = "rtmps-notice";
            div.style.position = "fixed";
            div.style.bottom = "15px";
            div.style.right = "15px";
            div.style.maxWidth = "480px";
            div.style.background = "#222";
            div.style.color = "#0f0";
            div.style.padding = "15px";
            div.style.borderRadius = "8px";
            div.style.fontFamily = "monospace";
            div.style.whiteSpace = "pre-wrap";
            div.style.boxShadow = "0 0 12px rgba(0,255,0,0.8)";
            div.style.zIndex = "99999";
            document.body.appendChild(div);
        }
        div.innerText = `✅ RTMPS 推流地址捕获成功：

📡 服务器地址：
${server}

🔑 推流码（Stream Key）：
${key}`;
        setTimeout(() => div.remove(), 30000);
    }

})();
