"use client";

import React, { useState, useEffect } from "react";
import { Folder, FileText, Shield, HardDrive, RefreshCw } from "lucide-react";
import { getClientToken } from "@/lib/clientAuth";

interface FsNode {
  id: string;
  parent_id: string | null;
  type: "file" | "directory";
  name: string;
  mode: number;
  size: number;
  owner_uid: string;
  updated_at: string;
}

interface FileExplorerProps {
  refreshTrigger: number;
  onRefreshDone?: () => void;
}

export function FileExplorer({ refreshTrigger, onRefreshDone }: FileExplorerProps) {
  const [nodes, setNodes] = useState<FsNode[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedDirs, setExpandedDirs] = useState<Record<string, boolean>>({});

  const formatModeString = (type: "file" | "directory", mode: number): string => {
    const typeChar = type === "directory" ? "d" : "-";
    const modeStr = mode.toString().padStart(3, "0");
    const getPerms = (digitChar: string) => {
      const val = parseInt(digitChar, 10);
      const r = val & 4 ? "r" : "-";
      const w = val & 2 ? "w" : "-";
      const x = val & 1 ? "x" : "-";
      return r + w + x;
    };
    return typeChar + getPerms(modeStr[0]) + getPerms(modeStr[1]) + getPerms(modeStr[2]);
  };

  const fetchTree = async () => {
    setLoading(true);
    try {
      const token = getClientToken();
      const res = await fetch("/api/workspace/tree", {
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setNodes(data.nodes || []);
      }
    } catch (err) {
      console.error("Failed to fetch filesystem tree:", err);
    } finally {
      setLoading(false);
      if (onRefreshDone) onRefreshDone();
    }
  };

  useEffect(() => {
    fetchTree();
  }, [refreshTrigger]);

  const toggleExpand = (dirId: string) => {
    setExpandedDirs((prev) => ({
      ...prev,
      [dirId]: !prev[dirId],
    }));
  };

  // Build tree from flat nodes list
  const renderTree = (parentId: string | null, depth: number = 0) => {
    const levelNodes = nodes.filter((n) => n.parent_id === parentId);
    
    if (levelNodes.length === 0) return null;

    return (
      <ul className="space-y-1.5 pl-3 border-l border-gray-150/40 ml-1.5">
        {levelNodes.map((node) => {
          const isDir = node.type === "directory";
          const isExpanded = expandedDirs[node.id] || false;
          const permString = formatModeString(node.type, node.mode);

          return (
            <li key={node.id} className="space-y-1">
              <div
                onClick={() => isDir && toggleExpand(node.id)}
                className={`flex items-center justify-between p-1.5 rounded text-xs select-none transition-colors ${
                  isDir ? "hover:bg-gray-100/60 cursor-pointer" : "hover:bg-gray-50/50"
                }`}
              >
                <div className="flex items-center space-x-2">
                  {isDir ? (
                    <Folder
                      size={14}
                      className={`text-green-500 fill-green-500/10 transition-transform ${
                        isExpanded ? "scale-105" : ""
                      }`}
                    />
                  ) : (
                    <FileText size={14} className="text-orange-400" />
                  )}
                  <span className={`font-mono text-gray-700 ${isDir ? "font-semibold" : ""}`}>
                    {node.name}
                  </span>
                </div>
                
                {/* Perm & Size info */}
                <div className="flex items-center space-x-2 text-[10px] text-gray-400 font-mono">
                  <span className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-500 border border-gray-200/50 flex items-center gap-0.5">
                    <Shield size={9} />
                    {permString}
                  </span>
                  {!isDir && <span>{node.size} B</span>}
                </div>
              </div>
              
              {isDir && isExpanded && renderTree(node.id, depth + 1)}
            </li>
          );
        })}
      </ul>
    );
  };

  const rootNode = nodes.find((n) => n.parent_id === null);

  return (
    <div className="bg-white rounded-lg border border-gray-200/80 shadow-sm p-4 flex flex-col h-full">
      <div className="flex items-center justify-between border-b border-gray-150/60 pb-2.5 mb-3.5">
        <div className="flex items-center space-x-2">
          <HardDrive size={16} className="text-[#16A34A]" />
          <h3 className="font-sans font-bold text-sm text-gray-800">File Explorer</h3>
        </div>
        <button
          onClick={fetchTree}
          disabled={loading}
          className="text-gray-400 hover:text-[#16A34A] transition-colors p-1 rounded hover:bg-gray-50 disabled:opacity-50"
          title="Refresh Explorer"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto max-h-[420px] scrollbar-thin">
        {loading && nodes.length === 0 ? (
          <div className="text-center text-xs text-gray-400 py-8 font-sans">
            Membaca virtual filesystem...
          </div>
        ) : rootNode ? (
          <div className="space-y-1">
            <div
              onClick={() => toggleExpand(rootNode.id)}
              className="flex items-center space-x-2 p-1.5 rounded text-xs select-none hover:bg-gray-100/60 cursor-pointer font-mono text-gray-800 font-bold"
            >
              <Folder size={14} className="text-green-600 fill-green-500/20" />
              <span>/ (root)</span>
            </div>
            {/* Always expand root */}
            {renderTree(rootNode.id, 0)}
          </div>
        ) : (
          <div className="text-center text-xs text-gray-400 py-8 font-sans">
            Workspace kosong atau belum diinisialisasi.
          </div>
        )}
      </div>
    </div>
  );
}
