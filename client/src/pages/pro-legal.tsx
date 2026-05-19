import { useRoute } from "wouter";
import { ArrowLeft } from "lucide-react";

const LEGAL_PAGES: Record<string, { title: string; content: string }> = {
  terms: {
    title: "Fonday Pro 이용약관",
    content: `Fonday Pro 서비스 이용약관

제1조 (목적)
본 약관은 주식회사 에드플러스(이하 "회사")가 운영하는 Fonday Pro 서비스(이하 "서비스")의 이용에 관한 사항을 규정합니다.

제2조 (서비스 내용)
1. AI 기반 피부 분석 및 점수화 (10개 항목)
2. 태블릿 기반 고객 상담 흐름 (4단계)
3. 고객 관리 및 상담 기록 저장
4. 관리 전후 비교 분석
5. 고객용 QR 리포트 생성 및 공유
6. 홈케어 가이드 자동 생성
7. 재방문 리마인더 관리
8. 샵 브랜딩 (로고, CTA 커스텀)
9. 기타 회사가 추가 개발하는 서비스

제3조 (이용 대상)
1. 본 서비스는 피부관리샵, 에스테틱 등 뷰티 전문 사업자를 대상으로 합니다.
2. 서비스 가입 시 사업자 정보(상호명, 대표자명)를 입력해야 합니다.
3. 가입 시 설정한 PIN 번호로 접속하며, 샵 코드가 발급됩니다.

제4조 (요금 및 결제)
1. Free 플랜: 월 5건 분석, 무료
2. Pro 플랜: 월 29,000원, 무제한 분석, 전체 기능
3. Premium 플랜: 월 79,000원, 다매장 관리, 우선 지원
4. 결제는 신용카드 또는 계좌이체로 진행됩니다.
5. 요금은 사전 고지 후 변경될 수 있습니다.

제5조 (환불 정책)
1. 구독 결제 후 7일 이내: 전액 환불 (분석 미사용 시)
2. 구독 결제 후 7일 초과: 잔여 기간 일할 계산 환불
3. 무료 체험 기간 중 해지: 과금 없음
4. 환불 요청: nexiope@gmail.com

제6조 (고객 데이터 관리)
1. 서비스를 통해 수집되는 고객 데이터(사진, 분석 결과, 상담 기록)의 관리 책임은 가입 사업자에게 있습니다.
2. 사업자는 고객으로부터 피부 사진 촬영 및 분석에 대한 동의를 받아야 합니다.
3. 회사는 사업자의 고객 데이터를 마케팅 등 별도 목적으로 사용하지 않습니다.

제7조 (AI 분석 면책)
1. AI 피부 분석 결과는 상담 보조 자료이며, 의학적 진단이 아닙니다.
2. 분석 결과에 기반한 시술/제품 추천은 사업자의 전문적 판단 하에 이루어져야 합니다.
3. AI 분석 결과의 정확성을 100% 보장하지 않습니다.

제8조 (서비스 중단 및 해지)
1. 사업자는 설정 페이지에서 언제든지 구독을 해지할 수 있습니다.
2. 해지 시 해당 결제 주기 종료까지 서비스를 이용할 수 있습니다.
3. 해지 후 데이터는 30일간 보관 후 영구 삭제됩니다.

제9조 (분쟁 해결)
서비스 이용과 관련한 분쟁은 대구광역시 소재 관할 법원을 제1심 법원으로 합니다.

시행일: 2026년 5월 1일
주식회사 에드플러스
사업자등록번호: 831-88-01319`,
  },
  privacy: {
    title: "Fonday Pro 개인정보 처리방침",
    content: `주식회사 에드플러스(이하 "회사")는 「개인정보 보호법」에 따라 Fonday Pro 서비스 이용자 및 고객의 개인정보를 보호하고 이와 관련한 고충을 신속하게 처리하기 위하여 다음과 같이 개인정보 처리방침을 수립·공개합니다.

제1조 (수집하는 개인정보)
1. 사업자(원장) 정보
  - 필수: 상호명, 대표자명, PIN 번호
  - 선택: 전화번호, 주소, 샵 로고
2. 고객 정보 (사업자가 입력)
  - 필수: 고객 이름
  - 선택: 전화번호, 나이, 성별, 메모
3. 분석 데이터
  - 피부 사진: AI 분석 후 R2 스토리지에 암호화 저장
  - 분석 결과: 점수, AI 코멘트, 관리 추천 내용
  - 상담 기록: 추천 관리, 홈케어 메모, 다음 방문일
4. 자동 수집 항목
  - 서비스 이용 기록, 접속 로그, 기기 정보

제2조 (개인정보의 수집 목적)
1. AI 피부 분석 및 상담 서비스 제공
2. 고객 관리 및 재방문 리마인더 기능
3. 관리 전후 비교 및 변화 추적
4. 고객용 리포트 생성 및 QR 공유
5. 서비스 개선을 위한 통계 분석 (비식별 처리)

제3조 (피부 사진의 처리)
1. 피부 사진은 Google Vertex AI(Gemini)를 통해 분석됩니다.
2. 분석 완료 후 사진은 Cloudflare R2에 암호화 저장됩니다.
3. 저장된 사진은 관리 전후 비교 및 고객 리포트에 사용됩니다.
4. 사업자가 고객 데이터를 삭제하면 관련 사진도 함께 삭제됩니다.
5. 회사는 사진을 AI 학습 등 별도 목적으로 사용하지 않습니다.

제4조 (개인정보의 보유 및 이용 기간)
1. 사업자 정보: 서비스 해지 후 30일 보관 후 파기
2. 고객 정보: 사업자가 직접 삭제하거나, 서비스 해지 시 함께 파기
3. 분석 데이터: 고객 정보와 동일한 보유 기간
4. 서비스 이용 기록: 최대 1년 보관 후 파기

제5조 (개인정보의 제3자 제공)
회사는 원칙적으로 개인정보를 제3자에게 제공하지 않습니다.
다만, 다음의 경우에는 예외로 합니다.
1. 이용자가 사전에 동의한 경우
2. 법령에 의하여 요구되는 경우

제6조 (개인정보 처리 위탁)
1. Google Cloud (Vertex AI): 피부 사진 AI 분석
2. Cloudflare (Pages, D1, R2): 서비스 호스팅, 데이터베이스, 이미지 저장
3. 위탁 업체는 위탁 목적 외 개인정보를 처리하지 않습니다.

제7조 (이용자의 권리)
사업자 및 고객은 언제든지 다음의 권리를 행사할 수 있습니다.
1. 개인정보 열람, 정정, 삭제 요구
2. 처리정지 요구
3. 동의 철회
문의: nexiope@gmail.com

제8조 (개인정보 보호 책임자)
- 회사명: 주식회사 에드플러스
- 대표자: 서상완
- 서비스명: Fonday Pro
- 사업자등록번호: 831-88-01319
- 이메일: nexiope@gmail.com
- 주소: 대구광역시 알파시티1로 160

제9조 (개인정보 처리방침의 변경)
이 개인정보 처리방침은 2026년 5월 1일부터 적용됩니다.
변경 사항이 있을 경우 시행 7일 전 서비스 내 공지합니다.`,
  },
};

export default function ProLegalPage() {
  const [, params] = useRoute("/pro/legal/:type");
  const type = params?.type || "terms";
  const page = LEGAL_PAGES[type];

  if (!page) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-slate-400">페이지를 찾을 수 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="flex items-center gap-3 px-4 py-3 max-w-3xl mx-auto">
          <button onClick={() => window.history.back()} className="w-9 h-9 rounded-full flex items-center justify-center bg-slate-100">
            <ArrowLeft className="w-4 h-4 text-slate-600" />
          </button>
          <h1 className="text-base font-bold text-slate-900">{page.title}</h1>
        </div>
      </div>
      <div className="max-w-3xl mx-auto px-4 py-6">
        <div className="whitespace-pre-line text-sm leading-relaxed text-slate-600">
          {page.content}
        </div>
      </div>
    </div>
  );
}
