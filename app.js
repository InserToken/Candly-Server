require("dotenv").config();
// require("./tasks/stockUpdater");
var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
var cors = require("cors");
/* --------------------------------------- */
var indexRouter = require("./routes/index");
var authRouter = require("./routes/auth");
var userStockRouter = require("./routes/userStock");

/* --------------------------------------- */
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const jwt = require("jsonwebtoken");
const SECRET_KEY = "MyJWT";
/* --------------------------------------- */
dotenv.config();
pw = process.env.PW;
const DB_URL = `mongodb+srv://pius0316:${pw}@upanddown.n3ptkyf.mongodb.net/?retryWrites=true&w=majority&appName=UpAndDown`;
mongoose
  .connect(DB_URL, {
    retryWrites: true,
    w: "majority",
    appName: "express-mongodb",
  })
  .then(() => {
    console.log("Connected Successful");
  })
  .catch((err) => {
    console.log(err);
  });
/* --------------------------------------- */
var app = express();
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://localhost",
      "http://15.164.239.245",
    ], // TODO: 클라이언트 주소 배포하면 추가해주기
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
  })
);
/* --------------------------------------- */
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));
/* --------------------------------------- */
app.use("/", indexRouter);
app.use("/api/auth", authRouter);
const seedRouter = require("./routes/seed");
app.use("/api/seed", seedRouter);
app.use("/api/userStock", userStockRouter);
const myPageRouter = require("./routes/myPage");
app.use("/api/myPage", myPageRouter);
app.use("/api/practiceSeed", practiceProblemSeedRouter);
// app.use("/api/stockSeed", stockSeedRouter);
app.use("/api/holiday", holidayRouter);
app.use("/api/practice", practiceProblemRouter);
app.use("/api/real", realRouter);
const newsRouter = require("./routes/news");
app.use("/api", newsRouter);
app.use("/api/rank", rankRouter);
/* --------------------------------------- */
require("./services/getHoliday");
/* --------------------------------------- */
const port = process.env.PORT || 3001;

// 서버 시작
app.listen(port, () => {
  console.log(`▶️ Server is listening on http://localhost:${port}`);
});

app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  // res.render("error");
});

module.exports = app;
