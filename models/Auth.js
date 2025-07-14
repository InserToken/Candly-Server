const mongoose = require("mongoose");
const { isEmail } = require("validator");
const bcrypt = require("bcrypt");

const authSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, "이메일을 입력해 주세요."],
    unique: true,
    lowercase: true,
    validate: [isEmail, "올바른 이메일 형식이 아닙니다."],
  },
  password: {
    type: String,
    required: [true, "비밀번호를 입력해 주세요."],
  },
  nickname: {
    type: String,
    required: [true, "닉네임을 입력해 주세요."],
  },
});

// 로그인
authSchema.statics.login = async function (email, password) {
  const auth = await this.findOne({ email });
  if (!auth) {
    // 이메일이 없을 때
    const error = new Error("이메일을 다시 확인해 주세요.");
    error.field = "email";
    throw error;
  }

  const isMatch = await bcrypt.compare(password, auth.password);
  if (!isMatch) {
    // 비밀번호가 틀렸을 때
    const error = new Error("비밀번호를 다시 확인해 주세요.");
    error.field = "password";
    throw error;
  }

  // 성공 시
  return auth.visibleUser;
};

// 노출할 필드만 반환하는 가상 프로퍼티
authSchema.virtual("visibleUser").get(function () {
  return {
    _id: this._id,
    email: this.email,
    nickname: this.nickname,
  };
});

// 회원가입
authSchema.statics.signUp = async function (email, password, nickname) {
  const salt = await bcrypt.genSalt();
  const hashedPassword = await bcrypt.hash(password, salt);

  try {
    const auth = await this.create({
      email,
      password: hashedPassword,
      nickname,
    });
    return {
      _id: auth._id,
      nickname: auth.nickname,
    };
  } catch (err) {
    // 중복된 이메일 처리
    if (err.code === 11000 && err.keyPattern && err.keyPattern.email) {
      const error = new Error(
        "이미 사용 중인 이메일입니다. 다른 이메일을 입력해 주세요."
      );
      error.field = "email";
      throw error;
    }

    // mongoose validation error 처리 (예: 이메일 형식이 잘못되었거나, 필수 값 누락 등)
    if (err.name === "ValidationError") {
      const firstErrorField = Object.keys(err.errors)[0];
      const errorMessage = err.errors[firstErrorField].message;
      const error = new Error(errorMessage);
      error.field = firstErrorField;
      throw error;
    }

    // 그 외 에러는 그대로 던짐
    throw err;
  }
};

const Auth = mongoose.model("Users", authSchema, "Users");
module.exports = Auth;
