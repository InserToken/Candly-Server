var express = require("express");
const Auth = require("../models/Auth");
const { createToken, verifyToken } = require("../utils/auth");
var router = express.Router();

router.post("/signup", async (req, res, next) => {
  try {
    const { email, password, nickname } = req.body;
    console.log(req.body);
    const user = await Auth.signUp(email, password, nickname);
    res.status(201).json(user);
  } catch (err) {
    console.error(err);
    res.status(400);
    next(err);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await Auth.login(email, password);
    const tokenMaxAge = 60 * 60 * 24 * 3;
    const token = createToken(user, tokenMaxAge);
    user.token = token;

    // TODO: user 콘솔 한 번 찍어보기
    console.log(user);

    res.status(201).json(user);
  } catch (err) {
    console.error(err);
    res.status(400);
    next(err);
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
