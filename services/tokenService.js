const fs = require("fs");
const path = require("path");
const fetch = require("node-fetch");

const CACHE_FILE = path.resolve(__dirname, "tokenCache.json");

let cachedToken = null;
let tokenExpiresAt = null;

// 서버 시작 시 캐시 파일에서 복구
(function loadTokenCache() {
  try {
    const data = fs.readFileSync(CACHE_FILE, "utf-8");
    const parsed = JSON.parse(data);

    if (parsed.token && parsed.expiresAt && Date.now() < parsed.expiresAt) {
      cachedToken = parsed.token;
      tokenExpiresAt = parsed.expiresAt;
      console.log("🔁 캐시된 토큰 복구 성공");
    }
  } catch {
    // 캐시 없음
  }
})();

function saveTokenCache(token, expiresAt) {
  fs.writeFileSync(CACHE_FILE, JSON.stringify({ token, expiresAt }), "utf-8");
  console.log("💾 토큰 캐시 저장 완료");
}
async function getAccessToken(forceRefresh = false) {
  const now = Date.now();

  if (!forceRefresh && cachedToken && tokenExpiresAt && now < tokenExpiresAt) {
    return cachedToken;
  }

  try {
    const res = await fetch(process.env.TOKEN_DOMAIN, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        grant_type: "client_credentials",
        appkey: process.env.API_APPKEY,
        appsecret: process.env.API_APPSECRET,
      }),
    });

    if (!res.ok) {
      const errorBody = await res.json();
      const isRateLimited =
        res.status === 403 && errorBody.error_code === "EGW00133";

      if (isRateLimited && cachedToken) {
        console.warn("⚠️ 토큰 요청 제한. 기존 토큰 재사용");
        return cachedToken;
      }

      throw new Error(
        `토큰 발급 실패: ${res.status} - ${
          errorBody.error_description || "Unknown"
        }`
      );
    }

    const data = await res.json();
    cachedToken = data.access_token;
    tokenExpiresAt = now + (data.expires_in - 300) * 1000;

    saveTokenCache(cachedToken, tokenExpiresAt);
    return cachedToken;
  } catch (err) {
    console.error("🚨 getAccessToken 오류:", err.message);
    if (!forceRefresh && cachedToken) {
      console.warn("🔁 기존 토큰 재사용 (예외 발생)");
      return cachedToken;
    }
    throw err;
  }
}

module.exports = { getAccessToken };
