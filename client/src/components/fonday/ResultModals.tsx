import React from "react";
import { AnimatePresence } from "framer-motion";
import { ResultAnalysisSheet } from "./ResultAnalysisSheet";
import { ResultImprovementsSheet } from "./ResultImprovementsSheet";
import { ResultNutrientsSheet } from "./ResultNutrientsSheet";
import { ResultCosmeticsGateSheet } from "./ResultCosmeticsGateSheet";
import { CosmeticsRegisterModal } from "./MyScreen";
import { RoutineUpdateSheet } from "./RoutineUpdateSheet";
import { ResultQuestSheet } from "./ResultQuestSheet";
import { PartnershipModal } from "./PartnershipModal";
import { WaitlistModal } from "./WaitlistModal";
import { todayStr, saveDiaryTodos } from "./utils";

type ResultModalsProps = {
  showAnalysis: boolean;
  setShowAnalysis: (v: boolean) => void;
  aiComment?: string;
  scores: any[];
  skinReport: { area: string; finding: string }[];
  finalType: string;
  showImprovements: boolean;
  setShowImprovements: (v: boolean) => void;
  improvements: { title: string; desc: string }[];
  cosmetics: { type: string; key: string; reason: string }[];
  showNutrients: boolean;
  setShowNutrients: (v: boolean) => void;
  avoidLunch: { food: string; why: string }[];
  avoidDinner: { food: string; why: string }[];
  showCosmeticsGate: boolean;
  setShowCosmeticsGate: (v: boolean) => void;
  language: string;
  onLoginFromGate: (provider: "kakao" | "line" | "google") => void;
  showCosmeticsRegister: boolean;
  setShowCosmeticsRegister: (v: boolean) => void;
  refreshCosmetics: (opts?: { openRoutineUpdate?: boolean }) => void;
  showRoutineUpdateSheet: boolean;
  setShowRoutineUpdateSheet: (v: boolean) => void;
  morningRoutineItems: string[];
  eveningRoutineItems: string[];
  routineUpdateItems: string[];
  showQuestSheet: boolean;
  setShowQuestSheet: (v: boolean) => void;
  totalPoints: number;
  questDoneCount: number;
  questBoard: any[];
  showPartnership: boolean;
  setShowPartnership: (v: boolean) => void;
  partnerForm: { name: string; company: string; email: string; message: string };
  setPartnerForm: (v: any) => void;
  handlePartnershipSubmit: (e: React.FormEvent) => void;
  isPartnerSubmitting: boolean;
  isPartnerSuccess: boolean;
  showWaitlist: boolean;
  setShowWaitlist: (v: boolean) => void;
  email: string;
  setEmail: (v: string) => void;
  isSubmitting: boolean;
  isSuccess: boolean;
  handleWaitlistSubmit: (e: React.FormEvent) => void;
};

export function ResultModals({
  showAnalysis, setShowAnalysis, aiComment, scores, skinReport, finalType,
  showImprovements, setShowImprovements, improvements, cosmetics,
  showNutrients, setShowNutrients, avoidLunch, avoidDinner,
  showCosmeticsGate, setShowCosmeticsGate, language, onLoginFromGate,
  showCosmeticsRegister, setShowCosmeticsRegister, refreshCosmetics,
  showRoutineUpdateSheet, setShowRoutineUpdateSheet, morningRoutineItems, eveningRoutineItems, routineUpdateItems,
  showQuestSheet, setShowQuestSheet, totalPoints, questDoneCount, questBoard,
  showPartnership, setShowPartnership, partnerForm, setPartnerForm, handlePartnershipSubmit, isPartnerSubmitting, isPartnerSuccess,
  showWaitlist, setShowWaitlist, email, setEmail, isSubmitting, isSuccess, handleWaitlistSubmit,
}: ResultModalsProps) {
  return (
    <>
      <ResultAnalysisSheet
        open={showAnalysis}
        onClose={() => setShowAnalysis(false)}
        aiComment={aiComment}
        scores={scores}
        skinReport={skinReport}
        finalType={finalType}
      />

      <ResultImprovementsSheet
        open={showImprovements}
        onClose={() => setShowImprovements(false)}
        improvements={improvements}
        cosmetics={cosmetics}
      />

      <ResultNutrientsSheet
        open={showNutrients}
        onClose={() => setShowNutrients(false)}
        finalType={finalType}
        avoidLunch={avoidLunch}
        avoidDinner={avoidDinner}
      />

      <ResultCosmeticsGateSheet
        open={showCosmeticsGate}
        language={language}
        onClose={() => setShowCosmeticsGate(false)}
        onLogin={(provider) => {
          setShowCosmeticsGate(false);
          onLoginFromGate(provider);
        }}
      />

      {/* 화장품 등록 모달 */}
      <AnimatePresence>
        {showCosmeticsRegister && (
          <CosmeticsRegisterModal
            onClose={() => setShowCosmeticsRegister(false)}
            onSuccess={() => {
              setShowCosmeticsRegister(false);
              void refreshCosmetics({ openRoutineUpdate: true });
            }}
          />
        )}
      </AnimatePresence>

      <RoutineUpdateSheet
        open={showRoutineUpdateSheet}
        onClose={() => setShowRoutineUpdateSheet(false)}
        morningRoutineItems={morningRoutineItems}
        eveningRoutineItems={eveningRoutineItems}
        onApply={() => {
          saveDiaryTodos(todayStr(), routineUpdateItems.map((text) => ({ text, done: false })));
          setShowRoutineUpdateSheet(false);
        }}
      />

      <ResultQuestSheet
        open={showQuestSheet}
        onClose={() => setShowQuestSheet(false)}
        totalPoints={totalPoints}
        doneCount={questDoneCount}
        totalCount={questBoard.length}
        questBoard={questBoard}
      />

      <PartnershipModal
        open={showPartnership}
        onClose={() => setShowPartnership(false)}
        form={partnerForm}
        onFormChange={setPartnerForm}
        onSubmit={handlePartnershipSubmit}
        submitting={isPartnerSubmitting}
        success={isPartnerSuccess}
      />

      {/* 얼리버드 모달 */}
      <WaitlistModal
        open={showWaitlist}
        onClose={() => setShowWaitlist(false)}
        email={email}
        onEmailChange={setEmail}
        isSubmitting={isSubmitting}
        isSuccess={isSuccess}
        onSubmit={handleWaitlistSubmit}
      />
    </>
  );
}
