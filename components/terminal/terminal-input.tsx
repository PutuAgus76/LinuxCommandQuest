"use client";

import React, { useRef } from "react";
import { Terminal } from "lucide-react";

export type ValidationStatus = "correct" | "near_miss" | "incorrect" | null;

export type TerminalEntry = {
  command: string;
  output?: string;
  status?: "success" | "error";
  cwdBefore?: string;
  cwdAfter?: string;
};

interface TerminalInputProps {
  value: string;
  onChange: (val: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
  placeholder?: string;
  history?: TerminalEntry[];
  cwd?: string;
  username?: string;
  vimMode?: boolean;
  vimSubMode?: "SHELL" | "NORMAL" | "INSERT" | "COMMAND";
}

export function TerminalInput({
  value,
  onChange,
  onSubmit,
  disabled = false,
  placeholder = "Ketik perintah di sini...",
  history = [],
  cwd = "~",
  username = "user",
  vimMode = false,
  vimSubMode = "SHELL",
}: TerminalInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const formatPromptPath = (fullPath: string, user: string) => {
    const homePrefix = `/home/${user}`;
    if (fullPath.startsWith(homePrefix)) {
      return "~" + fullPath.substring(homePrefix.length);
    }
    return fullPath;
  };

  let currentPromptStr = `${username}@linux-quest:${formatPromptPath(cwd, username)}$`;

  if (vimMode) {
    if (vimSubMode === "NORMAL") {
      currentPromptStr = "[VIM - NORMAL MODE] --";
    } else if (vimSubMode === "INSERT") {
      currentPromptStr = "[VIM - INSERT MODE] --";
    } else if (vimSubMode === "COMMAND") {
      currentPromptStr = "[VIM - COMMAND MODE] :";
    }
  }

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
        <div className="flex items-center space-x-2 select-none">
          <div className="w-3 h-3 rounded-full bg-[#f38ba8]" />
          <div className="w-3 h-3 rounded-full bg-[#f9e2af]" />
          <div className="w-3 h-3 rounded-full bg-[#a6e3a1]" />
        </div>
        <div className="text-[#a6adc8] text-xs flex items-center gap-1.5 font-sans select-none">
          <Terminal size={12} />
          <span>bash — simulator</span>
        </div>
        <div className="w-10" />
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

          {/* History / Transcript */}
          {history.map((hist, index) => {
            const hasCustomPrompt = hist.cwdBefore?.includes("[VIM") || hist.cwdBefore?.includes("@");
            const histPromptStr = hasCustomPrompt
              ? hist.cwdBefore
              : `${username}@linux-quest:${formatPromptPath(hist.cwdBefore || "~", username)}$`;
            return (
              <div key={index} className="space-y-1">
                {/* Prompt + command line */}
                <div className="flex items-start gap-1">
                  <span className="text-[#cba6f7] select-none whitespace-nowrap">{histPromptStr}</span>
                  <span className="text-[#a6e3a1] break-all">{hist.command}</span>
                </div>
                {/* Command output */}
                {hist.output !== undefined && hist.output !== "" && (
                  <div
                    className={`pl-1 whitespace-pre-wrap font-mono text-sm leading-relaxed ${
                      hist.status === "error" ? "text-[#f38ba8]" : "text-[#cdd6f4]"
                    }`}
                  >
                    {hist.output}
                  </div>
                )}
              </div>
            );
          })}

          {/* Current active prompt + input line */}
          <div className="flex items-center gap-1">
            <span className="text-[#cba6f7] select-none whitespace-nowrap">{currentPromptStr}</span>
            <input
              ref={inputRef}
              type="text"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={disabled}
              placeholder={placeholder}
              className="flex-1 bg-transparent border-none outline-none text-[#f5e0dc] caret-[#f5e0dc] focus:ring-0 p-0 m-0 placeholder-[#585b70] w-full min-w-0"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
