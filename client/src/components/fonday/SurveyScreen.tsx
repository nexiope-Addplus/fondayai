import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DEEP_GREEN, DEEP_GREEN_LIGHT, stagger, fadeChild } from "./constants";
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
    <motion.div className="flex flex-col h-[calc(100dvh-60px)]" variants={stagger} initial="initial" animate="animate">
      <motion.div variants={fadeChild} className="px-6 pt-8 pb-2 shrink-0">
        <div className="flex items-center gap-2 mb-1">
          <Button variant="ghost" size="icon" onClick={onBack} className="-ml-2">
            <ChevronLeft className="w-6 h-6" />
          </Button>
          <h2 className="text-xl font-bold" style={{ color: DEEP_GREEN }}>{t("survey.title")}</h2>
        </div>
        <p className="text-[13px] text-muted-foreground ml-10">{t("survey.subtitle")}</p>
      </motion.div>

      <div className="flex-1 overflow-y-auto overscroll-contain px-6">
        <div className="space-y-8 pb-4">
          <div className="space-y-3">
            <label className="text-[12px] font-bold ml-1 uppercase tracking-wider" style={{ color: DEEP_GREEN_LIGHT }}>{t("survey.gender")}</label>
            <div className="flex gap-2">
              {[t("survey.female"), t("survey.male")].map((item, idx) => (
                <Button key={idx} onClick={() => setGenderIdx(idx)} variant={genderIdx === idx ? "default" : "outline"}
                  className={`flex-1 h-14 rounded-2xl text-[14px] font-bold ${genderIdx === idx ? "bg-[#2D5F4F] hover:bg-[#2D5F4F]" : ""}`}>
                  {item}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-[12px] font-bold ml-1 uppercase tracking-wider" style={{ color: DEEP_GREEN_LIGHT }}>{t("survey.age")}</label>
            <div className="grid grid-cols-2 gap-2">
              {ageGroups.map((item, idx) => (
                <Button key={idx} onClick={() => setAgeIdx(idx)} variant={ageIdx === idx ? "default" : "outline"}
                  className={`h-12 rounded-2xl text-[13px] font-bold ${ageIdx === idx ? "bg-[#2D5F4F] hover:bg-[#2D5F4F]" : ""}`}>
                  {item}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-[12px] font-bold ml-1 uppercase tracking-wider" style={{ color: DEEP_GREEN_LIGHT }}>{t("survey.concerns")}</label>
            <div className="grid grid-cols-3 gap-2">
              {skinConcerns.map((item, idx) => (
                <Button key={idx} onClick={() => toggleConcern(idx)} variant={concernIdxs.includes(idx) ? "secondary" : "outline"}
                  className={`h-12 rounded-2xl text-[12px] font-bold ${concernIdxs.includes(idx) ? "bg-[#3D7A66] text-white hover:bg-[#3D7A66]" : ""}`}>
                  {item}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <motion.div variants={fadeChild} className="px-6 py-4 shrink-0 bg-white border-t border-stone-100">
        <Button onClick={() => onSubmit({
          gender: genderIdx === 0 ? t("survey.female") : t("survey.male"),
          age: ageGroups[ageIdx],
          genderIdx,
          ageIdx,
          skinType: "복합성",
          concerns: concernIdxs.map(i => skinConcerns[i]),
          condition: "맨얼굴"
        })}
          className="w-full h-14 rounded-2xl font-bold text-white shadow-xl bg-[#2D5F4F] hover:bg-[#3D7A66] text-lg">
          {t("survey.startBtn")}
        </Button>
      </motion.div>
    </motion.div>
  );
}
