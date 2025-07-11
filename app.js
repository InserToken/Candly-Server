var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
var cors = require("cors");
/* --------------------------------------- */
var indexRouter = require("./routes/index");
var usersRouter = require("./routes/users");
/* --------------------------------------- */
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const jwt = require("jsonwebtoken");
const SECRET_KEY = "MyJWT";
/* --------------------------------------- */
dotenv.config();
pw = process.env.PW;
// TODO DB_URL 몽고디비 파고 넣기
const DB_URL = ``;
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
    origin: ["http://localhost:3000"], // TODO: 클라이언트 주소 배포하면 추가해주기
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
app.use("/auth", authRouter);
/* --------------------------------------- */
// catch 404 and forward to error handler
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
  res.render("error");
});

module.exports = app;
