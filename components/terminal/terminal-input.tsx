"use client";

import React, { useRef } from "react";
import { Terminal } from "lucide-react";

interface TerminalInputProps {
  value: string;
  onChange: (val: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
  placeholder?: string;
  feedback?: string;
  isCorrect?: boolean | null;
  history?: Array<{ command: string; isCorrect: boolean; explanation?: string }>;
}

export function TerminalInput({
  value,
  onChange,
  onSubmit,
  disabled = false,
  placeholder = "Ketik perintah di sini...",
  feedback,
  isCorrect = null,
  history = []
}: TerminalInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleContainerClick = () => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (value.trim() && !disabled) {
        onSubmit();
      }
    }
  };

  return (
    <div
      onClick={handleContainerClick}
      className="w-full bg-[#1e1e2e] text-[#cdd6f4] rounded-lg shadow-lg border border-[#313244] font-mono text-sm overflow-hidden cursor-text transition-all duration-300 focus-within:ring-2 focus-within:ring-green-500/50"
    >
      {/* Terminal Header */}
      <div className="bg-[#181825] px-4 py-2 flex items-center justify-between border-b border-[#313244]">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-[#f38ba8] hover:opacity-80 transition-opacity"></div>
          <div className="w-3 h-3 rounded-full bg-[#f9e2af] hover:opacity-80 transition-opacity"></div>
          <div className="w-3 h-3 rounded-full bg-[#a6e3a1] hover:opacity-80 transition-opacity"></div>
        </div>
        <div className="text-[#a6adc8] text-xs flex items-center gap-1.5 font-sans select-none">
          <Terminal size={12} />
          <span>bash - simulator</span>
        </div>
        <div className="w-10"></div> {/* Spacer */}
      </div>

      {/* Terminal Body */}
      <div className="p-4 space-y-3 min-h-[160px] flex flex-col justify-between">
        <div className="space-y-2">
          {/* Welcome Message */}
          <div className="text-[#6c7086] text-xs select-none">
            Linux Command Quest Simulator v1.0.0
            <br />
            Ketik jawaban Anda sesuai instruksi di atas.
          </div>

          {/* History */}
          {history.map((hist, index) => (
            <div key={index} className="space-y-1">
              <div className="flex items-start gap-1">
                <span className="text-[#cba6f7] select-none">user@linux:~$</span>
                <span className="text-[#a6e3a1] break-all">{hist.command}</span>
              </div>
              <div
                className={`text-xs pl-4 border-l ${
                  hist.isCorrect
                    ? "text-[#a6e3a1] border-[#a6e3a1]"
                    : "text-[#f38ba8] border-[#f38ba8]"
                }`}
              >
                {hist.isCorrect ? "✓ Jawaban benar!" : "✗ Jawaban salah, coba lagi."}
                {hist.explanation && (
                  <div className="text-[#a6adc8] mt-0.5">{hist.explanation}</div>
                )}
              </div>
            </div>
          ))}

          {/* Current Command Line */}
          <div className="flex items-center gap-1">
            <span className="text-[#cba6f7] select-none">user@linux:~$</span>
            <input
              ref={inputRef}
              type="text"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={disabled}
              placeholder={placeholder}
              className="flex-1 bg-transparent border-none outline-none text-[#f5e0dc] caret-[#f5e0dc] focus:ring-0 p-0 m-0 placeholder-[#585b70] w-full"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
            />
          </div>
        </div>

        {/* Live Feedback Notification */}
        {feedback && (
          <div
            className={`mt-4 p-2.5 rounded text-xs select-none border transition-all duration-300 ${
              isCorrect
                ? "bg-[#a6e3a1]/10 text-[#a6e3a1] border-[#a6e3a1]/30"
                : isCorrect === false
                ? "bg-[#f38ba8]/10 text-[#f38ba8] border-[#f38ba8]/30 animate-pulse"
                : "bg-[#f9e2af]/10 text-[#f9e2af] border-[#f9e2af]/30"
            }`}
          >
            {feedback}
          </div>
        )}
      </div>
    </div>
  );
}
