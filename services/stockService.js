const fetch = require("node-fetch");
const { getAccessToken } = require("./tokenService");

async function getBalance(cano, acntPrdtCd, retry = false) {
  try {
    const token = await getAccessToken(retry); // retry 시 강제 재발급

    const url = new URL(
      "/uapi/domestic-stock/v1/trading/inquire-balance",
      process.env.API_DOMAIN
    );

    url.searchParams.set("CANO", cano);
    url.searchParams.set("ACNT_PRDT_CD", acntPrdtCd);
    url.searchParams.set("AFHR_FLPR_YN", "N");
    url.searchParams.set("INQR_DVSN", "02");
    url.searchParams.set("UNPR_DVSN", "01");
    url.searchParams.set("FUND_STTL_ICLD_YN", "N");
    url.searchParams.set("FNCG_AMT_AUTO_RDPT_YN", "N");
    url.searchParams.set("PRCS_DVSN", "00");
    url.searchParams.set("OFL_YN", "");
    url.searchParams.set("CTX_AREA_FK100", "");
    url.searchParams.set("CTX_AREA_NK100", "");

    const res = await fetch(url.toString(), {
      method: "GET",
      headers: {
        authorization: `Bearer ${token}`,
        appkey: process.env.API_APPKEY,
        appsecret: process.env.API_APPSECRET,
        tr_id: "VTTC8434R",
        accept: "*/*",
        "accept-encoding": "gzip, deflate, br",
        connection: "keep-alive",
        "user-agent": "PostmanRuntime/7.44.1",
      },
    });

    const body = await res.json();

    // 만료된 토큰 에러 처리
    if (body.msg_cd === "EGW00123" && !retry) {
      console.warn("🔁 만료된 토큰 감지, 재발급 후 재요청 시도");
      return await getBalance(cano, acntPrdtCd, true);
    }

    if (!res.ok || body.rt_cd === "1") {
      throw new Error(
        `잔고 조회 실패: ${res.status} - ${JSON.stringify(body)}`
      );
    }

    return body;
  } catch (err) {
    console.error("🚨 getBalance 오류:", err.message);
    throw err;
  }
}

module.exports = { getBalance };
