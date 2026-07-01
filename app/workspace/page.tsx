"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { FileExplorer } from "@/components/workspace/file-explorer";
import { modules } from "@/data/modules";
import { getClientToken, getLinuxUsername, setLinuxUsername } from "@/lib/clientAuth";
import { parseApiResponse } from "@/lib/apiHelper";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Terminal as TerminalIcon, 
  BookOpen, 
  Trash2, 
  History, 
  Play, 
  CheckCircle2, 
  Lock, 
  ChevronRight,
  RefreshCw,
  FolderOpen
} from "lucide-react";
import { toast } from "sonner";
import { isModuleLocked } from "@/lib/progress-utils";

interface LogLine {
  input?: string;
  output?: string;
  isError?: boolean;
  prompt?: string;
}

export default function WorkspacePage() {
  const [loading, setLoading] = useState(true);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [cwd, setCwd] = useState<string>("~");
  const [username, setUsername] = useState<string>("");
  const [inputValue, setInputValue] = useState("");
  const [loadingCommand, setLoadingCommand] = useState(false);
  const [logs, setLogs] = useState<LogLine[]>([]);
  const [cmdHistory, setCmdHistory] = useState<Array<{ command: string; status: string; created_at: string }>>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [completedModuleIds, setCompletedModuleIds] = useState<string[]>([]);
  
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize
  useEffect(() => {
    async function initWorkspace() {
      try {
        const token = getClientToken();

        // 1. Sync profile and workspace — get real linux_username from server
        const syncRes = await fetch("/api/profile/sync", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        });

        const syncData = await parseApiResponse(syncRes);
        // Use linux_username from Supabase profile (authoritative source)
        const uname: string = syncData.profile?.linux_username || getLinuxUsername();
        setUsername(uname);
        setLinuxUsername(uname); // keep localStorage in sync

        // 2. Get or reuse existing terminal session (don't always create new)
        const sessionRes = await fetch("/api/terminal/session", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        });

        const { session } = await parseApiResponse(sessionRes);
        setSessionId(session.id);
        // Set cwd from the persisted session state
        if (session.current_path) {
          setCwd(session.current_path);
        } else {
          setCwd(`/home/${uname}`);
        }

        // 3. Load history
        fetchHistory(session.id);

        setLogs([
          { output: "Welcome to Linux Command Quest Virtual Workspace v1.0.0" },
          { output: "Interact directly with your personal filesystem using bash commands." },
          { output: "Available commands: pwd, ls, cd, mkdir, touch, cat, echo, cp, mv, rm, chmod" },
          { output: `Your home directory is: /home/${uname}` },
          { output: "" }
        ]);

      } catch (err: any) {
        toast.error(err.message || "Initialization failed");
      } finally {
        setLoading(false);
      }
    }

    initWorkspace();
  }, []);

  // Auto scroll terminal
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs]);

  // Load completed module IDs from DB progress
  useEffect(() => {
    async function fetchProgress() {
      try {
        const token = getClientToken();
        if (!token) return;
        const res = await fetch("/api/course/progress", {
          headers: { "Authorization": `Bearer ${token}` }
        });
        const data = await parseApiResponse(res);
        setCompletedModuleIds(data.progress?.completedModuleIds || []);
      } catch (e) {
        // silent
      }
    }
    fetchProgress();
  }, []);

  const fetchHistory = async (sessId: string) => {
    try {
      const token = getClientToken();
      const res = await fetch(`/api/terminal/history?sessionId=${sessId}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await parseApiResponse(res);
      setCmdHistory(data.history || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCommandSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || !sessionId || loadingCommand) return;

    const command = inputValue;
    setInputValue("");
    setLoadingCommand(true);

    const formatPromptPath = (fullPath: string, user: string) => {
      const homePrefix = `/home/${user}`;
      if (fullPath.startsWith(homePrefix)) {
        return "~" + fullPath.substring(homePrefix.length);
      }
      return fullPath;
    };
    
    const activePrompt = `${username}@linux-quest:${formatPromptPath(cwd, username)}$`;

    // Append to logs locally
    setLogs((prev) => [...prev, { input: command, prompt: activePrompt }]);

    try {
      const token = getClientToken();
      const res = await fetch("/api/terminal/execute", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          sessionId,
          rawCommand: command
        })
      });

      const data = await parseApiResponse(res);

      if (data.cwd) {
        setCwd(data.cwd);
      }

      setLogs((prev) => [
        ...prev,
        {
          output: data.output || (data.status === "success" ? "" : "Unknown error"),
          isError: data.status === "error"
        }
      ]);

      // Trigger file explorer reload
      setRefreshTrigger((prev) => prev + 1);

      // Refresh history list
      fetchHistory(sessionId);

    } catch (err) {
      setLogs((prev) => [...prev, { output: "Connection failed.", isError: true }]);
    } finally {
      setLoadingCommand(false);
    }
  };

  const handleResetWorkspace = async () => {
    if (!confirm("Apakah Anda yakin ingin meriset seluruh filesystem? Semua file dan folder buatan Anda akan dihapus permanen!")) {
      return;
    }

    try {
      const token = getClientToken();
      const res = await fetch("/api/workspace/reset", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      await parseApiResponse(res);
      toast.success("Workspace berhasil diriset ke kondisi default.");
      setCwd(`/home/${username}`);
      setLogs((prev) => [
        ...prev,
        { output: "\n[System] Workspace has been reset to default state.\n" }
      ]);
      setRefreshTrigger((prev) => prev + 1);
      if (sessionId) fetchHistory(sessionId);
    } catch (err: any) {
      toast.error(err.message || "Gagal meriset workspace.");
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#16A34A]"></div>
          <p className="text-gray-500 font-sans text-sm">Menyiapkan workspace Linux Anda...</p>
        </div>
      ) : (
        <div className="flex-1 container mx-auto px-4 py-6 grid lg:grid-cols-12 gap-6 items-stretch">
          
          {/* Panel 1: Modules List (Left) */}
          <div className="lg:col-span-3 flex flex-col h-[580px] bg-white rounded-lg border border-gray-200 shadow-sm p-4 overflow-y-auto scrollbar-thin">
            <div className="flex items-center space-x-2 border-b border-gray-100 pb-3 mb-4 select-none">
              <BookOpen size={16} className="text-[#16A34A]" />
              <h3 className="font-sans font-bold text-sm text-gray-800">Daftar Modul Belajar</h3>
            </div>

            <div className="space-y-2.5 flex-1">
              {modules.map((mod) => {
                const isCompleted = completedModuleIds.includes(mod.moduleId);
                const isLocked = isModuleLocked(mod, completedModuleIds);

                return (
                  <div
                    key={mod.moduleId}
                    className={`flex items-center justify-between p-2.5 rounded-lg border transition-all ${
                      isCompleted
                        ? "bg-green-50/20 border-green-200 text-green-700"
                        : isLocked
                        ? "bg-gray-50/50 border-gray-100 opacity-60 cursor-not-allowed"
                        : "bg-white border-gray-200 hover:border-[#16A34A] text-gray-700"
                    }`}
                  >
                    <div className="flex flex-col min-w-0 pr-2">
                      <span className="font-sans font-bold text-xs truncate">{mod.title}</span>
                      <span className="font-mono text-[9px] text-gray-400 mt-0.5">Level {mod.level} • {mod.command}</span>
                    </div>

                    <div>
                      {isCompleted ? (
                        <CheckCircle2 size={15} className="text-green-600 shrink-0" />
                      ) : isLocked ? (
                        <Lock size={13} className="text-gray-400 shrink-0" />
                      ) : (
                        <Link href={`/modul/${mod.moduleId}`}>
                          <button className="text-white bg-[#16A34A] hover:bg-green-700 p-1.5 rounded-full shadow-sm hover:scale-105 transition-all">
                            <Play size={10} className="fill-current" />
                          </button>
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Panel 2: Terminal Simulator (Middle) */}
          <div className="lg:col-span-6 flex flex-col h-[580px] bg-[#1e1e2e] text-[#cdd6f4] rounded-lg shadow-lg border border-[#313244] overflow-hidden">
            {/* Header */}
            <div className="bg-[#181825] px-4 py-3 flex items-center justify-between border-b border-[#313244] select-none">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-[#f38ba8]"></div>
                <div className="w-3 h-3 rounded-full bg-[#f9e2af]"></div>
                <div className="w-3 h-3 rounded-full bg-[#a6e3a1]"></div>
              </div>
              <div className="text-[#a6adc8] text-xs flex items-center gap-1.5 font-mono">
                <TerminalIcon size={12} />
                <span>{username}@quest-virtual-shell</span>
              </div>
              <button
                onClick={handleResetWorkspace}
                className="text-[#f38ba8] hover:bg-[#f38ba8]/10 text-[10px] font-sans px-2 py-1 rounded border border-[#f38ba8]/20 transition-all flex items-center gap-1"
                title="Reset Filesystem"
              >
                <Trash2 size={11} />
                <span>Reset</span>
              </button>
            </div>

            {/* Output screen */}
            <div 
              onClick={() => inputRef.current?.focus()}
              className="flex-1 p-4 overflow-y-auto font-mono text-xs space-y-2 cursor-text scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-transparent"
            >
              {logs.map((log, index) => (
                <div key={index} className="space-y-0.5 whitespace-pre-wrap">
                  {log.prompt && (
                    <div className="flex items-center gap-1">
                      <span className="text-[#cba6f7]">{log.prompt}</span>
                      <span className="text-[#a6e3a1]">{log.input}</span>
                    </div>
                  )}
                  {log.output && (
                    <div className={log.isError ? "text-[#f38ba8] pl-2 border-l border-[#f38ba8]/30" : "text-[#cdd6f4] pl-2"}>
                      {log.output}
                    </div>
                  )}
                </div>
              ))}
              <div ref={bottomRef} />
            </div>

            {/* Form Input */}
            <form onSubmit={handleCommandSubmit} className="bg-[#181825] px-4 py-3 border-t border-[#313244] flex items-center gap-1">
              <span className="text-[#cba6f7] font-mono text-xs select-none">
                {username}@linux-quest:
                {(() => {
                  const homePrefix = `/home/${username}`;
                  if (cwd.startsWith(homePrefix)) {
                    return "~" + cwd.substring(homePrefix.length);
                  }
                  return cwd;
                })()}
                $
              </span>
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={loadingCommand ? "Memproses..." : "Ketik command di sini..."}
                disabled={loadingCommand}
                className="flex-1 bg-transparent border-none outline-none font-mono text-xs text-[#f5e0dc] caret-[#f5e0dc] placeholder-[#585b70] focus:ring-0 p-0 m-0 w-full ml-1 disabled:opacity-50"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck="false"
              />
            </form>
          </div>

          {/* Panel 3: File Explorer & History (Right) */}
          <div className="lg:col-span-3 flex flex-col h-[580px] space-y-4">
            
            {/* File Tree */}
            <div className="flex-1 min-h-[300px]">
              <FileExplorer refreshTrigger={refreshTrigger} />
            </div>

            {/* History Table */}
            <div className="h-[230px] bg-white rounded-lg border border-gray-200 shadow-sm p-4 flex flex-col">
              <div className="flex items-center space-x-2 border-b border-gray-100 pb-2 mb-2 select-none shrink-0">
                <History size={14} className="text-[#F97316]" />
                <h3 className="font-sans font-bold text-xs text-gray-800">Riwayat Command</h3>
              </div>

              <div className="flex-1 overflow-y-auto scrollbar-thin">
                {cmdHistory.length === 0 ? (
                  <div className="text-center text-[10px] text-gray-400 py-6 font-sans">
                    Belum ada command yang dijalankan.
                  </div>
                ) : (
                  <table className="w-full text-left font-sans text-[10px]">
                    <thead>
                      <tr className="border-b border-gray-100 text-gray-400">
                        <th className="py-1 font-semibold">Command</th>
                        <th className="py-1 font-semibold text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 font-mono text-gray-600">
                      {cmdHistory.map((hist, idx) => (
                        <tr key={idx}>
                          <td className="py-1.5 truncate max-w-[120px]" title={hist.command}>
                            {hist.command}
                          </td>
                          <td className="py-1.5 text-right font-sans">
                            <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${
                              hist.status === "success" 
                                ? "bg-green-50 text-green-600" 
                                : "bg-red-50 text-red-500"
                            }`}>
                              {hist.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

          </div>

        </div>
      )}
    </div>
  );
}
