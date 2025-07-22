// const express = require("express");
// const router = express.Router();
// const { GoogleGenerativeAI } = require("@google/generative-ai");

// // 환경 변수에서 API 키 읽기 (process.env.GENERATIVE_AI_API_KEY로 맞춰줘)
// const genAI = new GoogleGenerativeAI(process.env.GENERATIVE_AI_API_KEY);
// router.post("/grade", async (req, res) => {
//   try {
//     const { user_answer } = req.body;

//     // 최신 모델명 사용!
//     const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); // 또는 "gemini-1.5-pro"
//     const prompt = `너는 투자 교육 서비스의 채점자야. 아래 사용자 답변이 얼마나 구체적이고 정확한지를 기준별로 100점 만점 채점해줘.
//                     평가 기준:
//                     예측 논리 (25)
//                     차트 기술적 분석 (25)
//                     거시경제 반영 (15)
//                     시황 이슈 반영 (20)
//                     정량적 근거 (15)

//                     3문장 이내로 피드백을 주고, 초보자 학습 방향도 2가지 알려줘. 존댓말 사용.
//                     해당 문제에 대한 참고사항:이동평균선(MA)은 주가의 추세를 보여줍니다. 단기 MA(예: 5일선)가 장기 MA(20일선)를 위로 돌파하면, 상승 신호(골든크로스)로 해석합니다. 골든크로스를 포착하고, 이에 대한 언급 및 전망을 예측하였는지를 기준으로 채점해주세요.
//                     사용자:
//                     "${user_answer}"

//                     출력 형식(json, 숫자는 모두 int):
//                     {
//                     "score": 00,
//                     "breakdown": {
//                         "logic": 00,
//                         "technical": 00,
//                         "macroEconomy": 00,
//                         "marketIssues": 00,
//                         "quantEvidence": 00
//                     },
//                     "feedback": "여기에 3문장 이내 피드백",
//                     "study": ["학습 방향 1", "학습 방향 2"]
//                     }`;

//     const result = await model.generateContent(prompt);
//     const text = result.response.text();

//     res.json({ result: text });
//   } catch (e) {
//     console.error(e);
//     res.status(500).json({ error: "채점 실패" });
//   }
// });

// module.exports = router;

const express = require("express");
const router = express.Router();
const { GoogleGenAI, Type } = require("@google/genai"); // 최신 패키지(@google/genai) 기준

// 아래 2개 모델은 실제 네 프로젝트에 맞게 import (경로/이름 맞게!)
const PracticeProblem = require("../models/PracticeProblem");
const ProblemType = require("../models/ProblemType");

const genAI = new GoogleGenAI({ apiKey: process.env.GENERATIVE_AI_API_KEY });

// /api/gemini/grade/:problemId
router.post("/grade/:problemId", async (req, res) => {
  try {
    const { problemId } = req.params;
    const { user_answer } = req.body;

    // 1. 문제 조회
    const practiceProblem = await PracticeProblem.findById(problemId);
    if (!practiceProblem) return res.status(404).json({ error: "문제 없음" });

    // 2. 문제유형 조회
    const problemType = await ProblemType.findById(practiceProblem.problemType);
    if (!problemType) return res.status(404).json({ error: "문제 유형 없음" });

    // 3. 프롬프트 동적으로 생성 (문제유형 내용 반영)
    const prompt = `
      너는 투자 교육 서비스의 채점자야. 아래 사용자 답변이 얼마나 구체적이고 정확한지를 기준별로 100점 만점 채점해줘.
      문제 유형: ${problemType.name}
      유형 설명: ${problemType.description}
      채점 기준: ${problemType.scoringCriteria}
      참고사항: ${practiceProblem.tip || ""}
      사용자: "${user_answer}"

      출력 형식(json, 숫자는 모두 int):
      {
        "score": 00,
        "breakdown": {
          "logic": 00,
          "technical": 00,
          "macroEconomy": 00,
          "marketIssues": 00,
          "quantEvidence": 00
        },
        "feedback": "여기에 3문장 이내 피드백",
        "study": ["학습 방향 1", "학습 방향 2"]
      }
    `;

    // 4. Gemini LLM 호출 (스키마 강제, 최신 구조)
    const response = await genAI.models.generateContent({
      model: "gemini-1.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.INTEGER },
            breakdown: {
              type: Type.OBJECT,
              properties: {
                logic: { type: Type.INTEGER },
                technical: { type: Type.INTEGER },
                macroEconomy: { type: Type.INTEGER },
                marketIssues: { type: Type.INTEGER },
                quantEvidence: { type: Type.INTEGER },
              },
            },
            feedback: { type: Type.STRING },
            study: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
          },
        },
      },
    });

    // response.parsed로 바로 파싱된 객체 반환
    res.json({ result: response.parsed });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "채점 실패" });
  }
});

module.exports = router;
