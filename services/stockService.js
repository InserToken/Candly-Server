const fetch = require("node-fetch");

async function getBalance(cano, acntPrdtCd) {
  try {
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

    console.log("요청 URL:", url.toString());

    const res = await fetch(url.toString(), {
      method: "GET",
      headers: {
        authorization: `Bearer ${process.env.API_TOKEN}`,
        appkey: process.env.API_APPKEY,
        appsecret: process.env.API_APPSECRET,
        tr_id: "VTTC8434R",
        accept: "*/*",
        "accept-encoding": "gzip, deflate, br",
        connection: "keep-alive",
        "user-agent": "PostmanRuntime/7.44.1",
      },
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`잔고 조회 실패: ${res.status} - ${errText}`);
    }

    return await res.json();
  } catch (err) {
    console.error("🚨 getBalance 오류:", err.message);
    throw err;
  }
}

module.exports = { getBalance };
