import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { stagger, fadeChild, TEXT_TERTIARY, FONT_HEADING } from "./constants";
import type { SurveyData } from "./types";

// ─── 설문 화면 ────────────────────────────────────────────────────
export function SurveyScreen({ onSubmit, onBack }: {
  onSubmit: (data: SurveyData) => void;
  onBack: () => void;
}) {
  const { t } = useTranslation();
  const [genderIdx, setGenderIdx] = useState(0); // 0=female, 1=male
  const [ageIdx, setAgeIdx] = useState(2);
  const ageGroups = t("survey.ageGroups", { returnObjects: true }) as string[];
  const skinConcerns = t("survey.skinConcerns", { returnObjects: true }) as string[];
  const [concernIdxs, setConcernIdxs] = useState<number[]>([]);
  const toggleConcern = (i: number) => setConcernIdxs(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i]);

  return (
    <motion.div className="flex flex-col h-[calc(100dvh-64px)]" style={{ background: "linear-gradient(180deg, #FAFBFB 0%, #F3F6F5 50%, #FAFBFB 100%)" }} variants={stagger} initial="initial" animate="animate">
      <motion.div variants={fadeChild} className="px-5 pt-8 pb-2 shrink-0">
        <div className="flex items-center gap-2 mb-1">
          <Button variant="ghost" size="icon" onClick={onBack} className="-ml-2">
            <ChevronLeft className="w-6 h-6" style={{ color: "#5C4F4A" }} />
          </Button>
          <h2 className="text-[22px] font-extrabold" style={{ color: "#4A403A", fontFamily: FONT_HEADING }}>{t("survey.title")}</h2>
        </div>
        <p className="text-[13px] ml-10" style={{ color: "#8C8078" }}>{t("survey.subtitle")}</p>
      </motion.div>

      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-5">
        <div className="space-y-8 pb-4">
          <div className="space-y-3">
            <label className="text-[12px] font-bold ml-1 uppercase tracking-wider" style={{ color: TEXT_TERTIARY }}>{t("survey.gender")}</label>
            <div className="flex gap-2">
              {[t("survey.female"), t("survey.male")].map((item, idx) => (
                <button key={idx} onClick={() => setGenderIdx(idx)}
                  className="flex-1 h-14 text-[14px] font-semibold transition-all"
                  style={genderIdx === idx
                    ? { background: "#C97062", color: "#FFFFFF", borderRadius: 24 }
                    : { background: "#FFFFFF", color: "#6B5D55", borderRadius: 24, boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-[12px] font-bold ml-1 uppercase tracking-wider" style={{ color: TEXT_TERTIARY }}>{t("survey.age")}</label>
            <div className="grid grid-cols-2 gap-2">
              {ageGroups.map((item, idx) => (
                <button key={idx} onClick={() => setAgeIdx(idx)}
                  className="h-12 text-[13px] font-semibold transition-all"
                  style={ageIdx === idx
                    ? { background: "#C97062", color: "#FFFFFF", borderRadius: 20 }
                    : { background: "#FFFFFF", color: "#6B5D55", borderRadius: 20, boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-[12px] font-bold ml-1 uppercase tracking-wider" style={{ color: TEXT_TERTIARY }}>{t("survey.concerns")}</label>
            <div className="grid grid-cols-3 gap-2">
              {skinConcerns.map((item, idx) => (
                <button key={idx} onClick={() => toggleConcern(idx)}
                  className="h-12 text-[12px] font-semibold transition-all"
                  style={concernIdxs.includes(idx)
                    ? { background: "#C97062", color: "#FFFFFF", borderRadius: 20 }
                    : { background: "#FFFFFF", color: "#6B5D55", borderRadius: 20, boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
                  {item}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <motion.div variants={fadeChild} className="px-5 py-4 shrink-0" style={{ zIndex: 10 }}>
        <button onClick={() => onSubmit({
          gender: genderIdx === 0 ? t("survey.female") : t("survey.male"),
          age: ageGroups[ageIdx],
          genderIdx,
          ageIdx,
          skinType: "복합성",
          concerns: concernIdxs.map(i => skinConcerns[i]),
          condition: "맨얼굴"
        })}
          className="w-full text-white font-semibold text-[16px]"
          style={{ background: "#C97062", boxShadow: "0 4px 16px rgba(201,112,98,0.25)", height: 56, borderRadius: 28 }}>
          {t("survey.startBtn")}
        </button>
      </motion.div>
    </motion.div>
  );
}
