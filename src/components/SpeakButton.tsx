"use client";

import { useState } from "react";

type Props = {
  text: string;
  /** ป้ายกำกับสำหรับ screen reader / title */
  label?: string;
  /** ขนาดไอคอน — sm สำหรับในประโยค, md สำหรับหัวคำ */
  size?: "sm" | "md";
  className?: string;
};

export function SpeakButton({ text, label, size = "sm", className = "" }: Props) {
  const [speaking, setSpeaking] = useState(false);

  function handleSpeak(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      alert("เบราว์เซอร์นี้ไม่รองรับการอ่านออกเสียง");
      return;
    }

    const synth = window.speechSynthesis;
    synth.cancel();

    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "en-US";
    utter.rate = 0.9;

    const enVoice = synth
      .getVoices()
      .find((v) => v.lang.toLowerCase().startsWith("en"));
    if (enVoice) utter.voice = enVoice;

    utter.onstart = () => setSpeaking(true);
    utter.onend = () => setSpeaking(false);
    utter.onerror = () => setSpeaking(false);

    synth.speak(utter);
  }

  const sizeCls = size === "md" ? "h-9 w-9 text-lg" : "h-7 w-7 text-sm";

  return (
    <button
      type="button"
      onClick={handleSpeak}
      title={label ?? "ฟังเสียง"}
      aria-label={label ?? "ฟังเสียง"}
      className={`inline-flex shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/5 hover:border-emerald-400 hover:bg-emerald-400/10 ${
        speaking ? "border-emerald-400 text-emerald-300" : "text-white/70"
      } ${sizeCls} ${className}`}
    >
      {speaking ? "🔊" : "🔈"}
    </button>
  );
}
