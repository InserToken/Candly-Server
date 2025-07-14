const fetch = require("node-fetch");

let cachedToken = null;

async function getAccessToken() {
  if (cachedToken) return cachedToken;

  const res = await fetch(`${process.env.TOKEN_DOMAIN}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      grant_type: "client_credentials",
      appkey: process.env.API_APPKEY,
      appsecret: process.env.API_APPSECRET,
    }),
  });

  if (!res.ok) throw new Error("토큰 발급 실패");

  const data = await res.json();
  cachedToken = data.access_token;
  return cachedToken;
}

module.exports = { getAccessToken };
