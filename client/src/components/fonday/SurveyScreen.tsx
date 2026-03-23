import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DEEP_GREEN, DEEP_GREEN_LIGHT, stagger, fadeChild, FONT_DISPLAY, TEXT_TERTIARY } from "./constants";
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
    <motion.div className="flex flex-col h-[calc(100dvh-64px)]" variants={stagger} initial="initial" animate="animate">
      <motion.div variants={fadeChild} className="px-6 pt-8 pb-2 shrink-0">
        <div className="flex items-center gap-2 mb-1">
          <Button variant="ghost" size="icon" onClick={onBack} className="-ml-2">
            <ChevronLeft className="w-6 h-6" />
          </Button>
          <h2 className="text-xl font-semibold" style={{ color: DEEP_GREEN }}>{t("survey.title")}</h2>
        </div>
        <p className="text-[13px] text-muted-foreground ml-10">{t("survey.subtitle")}</p>
      </motion.div>

      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-6">
        <div className="space-y-8 pb-4">
          <div className="space-y-3">
            <label className="text-[12px] font-semibold ml-1 uppercase tracking-wider" style={{ fontFamily: FONT_DISPLAY, color: TEXT_TERTIARY }}>{t("survey.gender")}</label>
            <div className="flex gap-2">
              {[t("survey.female"), t("survey.male")].map((item, idx) => (
                <Button key={idx} onClick={() => setGenderIdx(idx)} variant={genderIdx === idx ? "default" : "outline"}
                  className={`flex-1 h-14 rounded-2xl text-[14px] font-semibold ${genderIdx === idx ? "bg-[#4A7C6E] hover:bg-[#4A7C6E]" : ""}`}>
                  {item}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-[12px] font-semibold ml-1 uppercase tracking-wider" style={{ fontFamily: FONT_DISPLAY, color: TEXT_TERTIARY }}>{t("survey.age")}</label>
            <div className="grid grid-cols-2 gap-2">
              {ageGroups.map((item, idx) => (
                <Button key={idx} onClick={() => setAgeIdx(idx)} variant={ageIdx === idx ? "default" : "outline"}
                  className={`h-12 rounded-2xl text-[13px] font-semibold ${ageIdx === idx ? "bg-[#4A7C6E] hover:bg-[#4A7C6E]" : ""}`}>
                  {item}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-[12px] font-semibold ml-1 uppercase tracking-wider" style={{ fontFamily: FONT_DISPLAY, color: TEXT_TERTIARY }}>{t("survey.concerns")}</label>
            <div className="grid grid-cols-3 gap-2">
              {skinConcerns.map((item, idx) => (
                <Button key={idx} onClick={() => toggleConcern(idx)} variant={concernIdxs.includes(idx) ? "secondary" : "outline"}
                  className={`h-12 rounded-2xl text-[12px] font-semibold ${concernIdxs.includes(idx) ? "bg-[#3D7A66] text-white hover:bg-[#3D7A66]" : ""}`}>
                  {item}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <motion.div variants={fadeChild} className="px-6 py-4 shrink-0 bg-white border-t border-stone-100" style={{ zIndex: 10 }}>
        <Button onClick={() => onSubmit({
          gender: genderIdx === 0 ? t("survey.female") : t("survey.male"),
          age: ageGroups[ageIdx],
          genderIdx,
          ageIdx,
          skinType: "복합성",
          concerns: concernIdxs.map(i => skinConcerns[i]),
          condition: "맨얼굴"
        })}
          className="w-full h-14 rounded-2xl font-semibold text-white shadow-xl bg-[#4A7C6E] hover:bg-[#3D7A66] text-lg">
          {t("survey.startBtn")}
        </Button>
      </motion.div>
    </motion.div>
  );
}
