const mongoose = require("mongoose");
const { isEmail } = require("validator");
const bcrypt = require("bcrypt");

const authSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, "이메일을 입력해 주세요."],
    unique: true,
    lowercase: true,
    validator: [isEmail, "올바른 이메일 형식이 아닙니다."],
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

authSchema.statics.login = async function (email, password) {
  const auth = await this.findOne({ email });
  if (auth) {
    const signup = await bcrypt.compare(password, auth.password);
    if (signup) {
      return auth.visibleUser;
    }
    throw Error("비밀번호가 맞지 않습니다.");
  }
  throw Error("이메일이 맞지 않습니다.");
};

const visibleUser = authSchema.virtual("visibleUser");
visibleUser.get(function (value, virtual, doc) {
  return {
    _id: doc._id,
    email: doc.email,
  };
});

authSchema.statics.signUp = async function (email, password, nickname) {
  const salt = await bcrypt.genSalt();

  try {
    const hashedPassword = await bcrypt.hash(password, salt);
    const auth = await this.create({
      email,
      password: hashedPassword,
      nickname,
    });
    return {
      _id: auth._id,
      nickname: auth._id,
    };
  } catch (err) {
    throw err;
  }
};

const Auth = mongoose.model("Auth", authSchema, "Auth");
module.exports = Auth;
