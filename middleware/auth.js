const { verifyToken } = require("../utils/auth");

function authenticate(req, res, next) {
  try {
    let token;
    if (req.headers.authorization) {
      token = req.headers.authorization.split(" ")[1];
    } else if (req.cookies.authToken) {
      token = req.cookies.authToken;
    }
    if (token) {
      console.log("서버가 받은 토큰 (앞 30자):", token.slice(0, 30) + "...");
    } else {
      console.log("서버가 받은 토큰: 없음");
    }

    const userPayload = verifyToken(token);

    if (!userPayload) {
      throw new Error("유효하지 않거나 존재하지 않는 토큰입니다.");
    }

    req.user = userPayload;
    next();
  } catch (error) {
    const authError = new Error("Authorization Failed: 인증에 실패했습니다.");
    authError.status = 401;
    next(authError);
  }
}

module.exports = { authenticate };
