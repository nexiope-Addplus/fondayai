/**
 * Day 0 스파이크: Gemini 피부 분석 점수 안정성 테스트
 *
 * 같은 이미지를 2번 분석해서 점수가 일관되는지 확인합니다.
 * Go/No-Go 기준: 10개 메트릭 중 8개 이상이 ±5점 이내
 *
 * 사용법: npx tsx script/day0-spike.ts [이미지경로]
 * 예: npx tsx script/day0-spike.ts ./TalkMedia_i_d9c56a136844.jpeg.jpeg
 */

import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";

dotenv.config();

const SCORE_LABELS = [
  "종합 컨디션", "수분 밸런스", "붉은기 수준", "모공 상태", "주름 및 탄력",
  "잡티/색소침착", "트러블 위험", "다크서클", "피부 광채", "피부결 균일도"
];

const STABILITY_THRESHOLD = 5; // ±5점 이내면 안정
const PASS_RATIO = 0.8; // 10개 중 8개 이상 안정이면 Go

function parseGeminiJson(text: string) {
  const jsonStart = text.indexOf("{");
  const jsonEnd = text.lastIndexOf("}");
  if (jsonStart === -1 || jsonEnd === -1) throw new Error("JSON 파싱 실패");
  const candidate = text.slice(jsonStart, jsonEnd + 1)
    .replace(/```json|```/gi, "")
    .replace(/[""]/g, '"')
    .replace(/['']/g, "'")
    .replace(/,\s*([}\]])/g, "$1");
  return JSON.parse(candidate);
}

async function analyzeImage(genAI: GoogleGenerativeAI, base64: string, mimeType: string): Promise<Record<string, number>> {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: {
      responseMimeType: "application/json",
      // @ts-ignore
      thinkingConfig: { thinkingBudget: 1024 },
    },
    safetySettings: [
      { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
      { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
      { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
      { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
    ]
  });

  const prompt = `당신은 피부과 전문의입니다. 첨부된 얼굴 사진을 분석하여 아래 JSON 형식으로만 답하세요.

중요 규칙: 모든 점수는 0~100 정수이며, 100이 가장 좋은 상태입니다.
- 붉은기 수준: 100 = 붉은기가 전혀 없는 깨끗한 피부, 0 = 심한 홍조/발적
- 트러블 위험: 100 = 트러블 위험이 전혀 없음, 0 = 심한 여드름/트러블
- 다크서클: 100 = 다크서클이 전혀 없음, 0 = 심한 다크서클
- 잡티/색소침착: 100 = 잡티가 전혀 없음, 0 = 심한 잡티/색소침착
- 나머지 항목도 동일: 100 = 최상, 0 = 최악

scores 배열은 반드시 아래 10개 항목을 순서대로 모두 포함해야 합니다:
{"label":"종합 컨디션","score":숫자}
{"label":"수분 밸런스","score":숫자}
{"label":"붉은기 수준","score":숫자}
{"label":"모공 상태","score":숫자}
{"label":"주름 및 탄력","score":숫자}
{"label":"잡티/색소침착","score":숫자}
{"label":"트러블 위험","score":숫자}
{"label":"다크서클","score":숫자}
{"label":"피부 광채","score":숫자}
{"label":"피부결 균일도","score":숫자}
출력: {"scores":[...위 10개...]}`;

  const result = await model.generateContent([
    prompt,
    { inlineData: { data: base64, mimeType } }
  ]);

  const text = result.response.text();
  const parsed = parseGeminiJson(text);

  const scores: Record<string, number> = {};
  for (const item of parsed.scores || []) {
    scores[item.label] = item.score;
  }
  return scores;
}

async function main() {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    console.error("❌ GOOGLE_API_KEY가 .env에 없습니다.");
    process.exit(1);
  }

  const imagePath = process.argv[2];
  if (!imagePath) {
    console.error("사용법: npx tsx script/day0-spike.ts [이미지경로]");
    console.error("예: npx tsx script/day0-spike.ts ./TalkMedia_i_d9c56a136844.jpeg.jpeg");
    process.exit(1);
  }

  const absPath = path.resolve(imagePath);
  if (!fs.existsSync(absPath)) {
    console.error(`❌ 파일을 찾을 수 없습니다: ${absPath}`);
    process.exit(1);
  }

  const ext = path.extname(absPath).toLowerCase();
  const mimeType = ext === ".png" ? "image/png" : "image/jpeg";
  const base64 = fs.readFileSync(absPath).toString("base64");

  const genAI = new GoogleGenerativeAI(apiKey);

  console.log("\n🔬 Day 0 스파이크: Gemini 점수 안정성 테스트");
  console.log(`📸 이미지: ${path.basename(absPath)}`);
  console.log("─".repeat(60));

  // 1차 분석
  console.log("\n⏳ 1차 분석 중...");
  const scores1 = await analyzeImage(genAI, base64, mimeType);

  // 잠깐 대기 (rate limit 방지)
  await new Promise(r => setTimeout(r, 2000));

  // 2차 분석
  console.log("⏳ 2차 분석 중...");
  const scores2 = await analyzeImage(genAI, base64, mimeType);

  // 결과 비교
  console.log("\n" + "═".repeat(60));
  console.log("  메트릭             | 1차  | 2차  | 차이 | 결과");
  console.log("─".repeat(60));

  let stableCount = 0;
  for (const label of SCORE_LABELS) {
    const s1 = scores1[label] ?? -1;
    const s2 = scores2[label] ?? -1;
    const diff = Math.abs(s1 - s2);
    const stable = diff <= STABILITY_THRESHOLD;
    if (stable) stableCount++;

    const labelPad = label.padEnd(16);
    const s1Pad = String(s1).padStart(4);
    const s2Pad = String(s2).padStart(4);
    const diffPad = String(diff).padStart(4);
    const icon = stable ? "✅" : "❌";
    console.log(`  ${labelPad} | ${s1Pad} | ${s2Pad} | ${diffPad} | ${icon}`);
  }

  console.log("─".repeat(60));
  const ratio = stableCount / SCORE_LABELS.length;
  const passed = ratio >= PASS_RATIO;

  console.log(`\n  안정 메트릭: ${stableCount}/${SCORE_LABELS.length} (${(ratio * 100).toFixed(0)}%)`);
  console.log(`  기준: ${(PASS_RATIO * 100).toFixed(0)}% 이상 (±${STABILITY_THRESHOLD}점 이내)`);
  console.log(`\n  ${passed ? "🟢 GO — 점수가 충분히 안정적입니다." : "🔴 NO-GO — 점수 변동이 너무 큽니다. 프롬프트 개선이 필요합니다."}`);
  console.log("═".repeat(60));
}

main().catch(e => {
  console.error("에러:", e.message);
  process.exit(1);
});
