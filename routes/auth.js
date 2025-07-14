var express = require("express");
const Auth = require("../models/Auth");
const { createToken } = require("../utils/auth");
var router = express.Router();

router.post("/signup", async (req, res) => {
  try {
    const { email, password, nickname } = req.body;
    console.log(req.body);
    const user = await Auth.signUp(email, password, nickname);
    res.status(201).json(user);
  } catch (err) {
    console.error(err);
    res.status(400).json({
      field: err.field || null,
      message: err.message || "회원가입 중 오류가 발생했습니다.",
    });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await Auth.login(email, password);
    const tokenMaxAge = 60 * 60 * 24 * 3;
    const token = createToken(user, tokenMaxAge);
    user.token = token;

    console.log(user); // 로그인 성공 시 콘솔 확인

    res.status(200).json(user);
  } catch (err) {
    console.error(err);
    res.status(400).json({
      field: err.field || null,
      message: err.message || "로그인 중 오류가 발생했습니다.",
    });
  }
});

router.all("/logout", (req, res) => {
  // 쿠키에 authToken이 있으면 지우기
  res.clearCookie("authToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });
  // 클라이언트에 응답
  res.status(200).json({ message: "로그아웃되었습니다." });
});

module.exports = router;
