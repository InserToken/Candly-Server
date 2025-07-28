const express = require("express");
const router = express.Router();
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GENERATIVE_AI_API_KEY);

router.post("/grade", async (req, res) => {
  try {
    const { prompt, user_answer } = req.body;

    if (!prompt || !user_answer) {
      return res
        .status(400)
        .json({ error: "prompt와 user_answer 모두 필요합니다." });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const fullPrompt = `
너는 투자 교육 서비스의 채점자야. 아래 사용자 답변이 얼마나 구체적이고 정확한지를 기준별로 100점 만점 채점해줘.
차트 기술적 분석에 비중을 두고 채점해줘.
평가 기준:
예측 논리 (15)
차트 기술적 분석 (50)
거시경제 반영 (10)
시황 이슈 반영 (10)
정량적 근거 (15)

3문장 이내로 피드백을 주고, 초보자 학습 방향도 2가지 알려줘. 존댓말 사용.
해당 문제에 대한 참고사항: ${prompt}
사용자:
"${user_answer}"

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

    const result = await model.generateContent(fullPrompt);
    const text = result.response.text();

    res.json({ result: text }); // ✅ 파싱 없이 그대로 응답
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "채점 실패" });
  }
});

module.exports = router;
