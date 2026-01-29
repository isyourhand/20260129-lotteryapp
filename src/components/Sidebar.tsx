// src/components/Sidebar.tsx
// 侧边栏组件

import React from "react";
import type { Participant, PrizeConfig } from "../types";
import { PRIZES } from "../config/prizes";

interface Props {
  active?: PrizeConfig;
  history: Record<number, Participant[]>;
  onExport: () => void;
  onReset: () => void;
}

export const Sidebar: React.FC<Props> = ({
  active,
  history,
  onExport,
  onReset,
}) => {
  const hasHistory = Object.keys(history).length > 0;

  return (
    <div className="sidebar">
      <div className="prize-list">
        {PRIZES.map((p) => (
          <div
            key={p.level}
            className={`prize-item ${active?.level === p.level ? "active" : ""}`}
          >
            <div className="prize-icon" />
            <div className="prize-info">
              <h3>{p.name}</h3>
              <span>
                已抽取: {history[p.level]?.length ?? 0} / {p.count}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* 底部按钮区域 */}
      <div
        className="sidebar-footer"
        style={{
          padding: "20px",
          marginTop: "auto",
          borderTop: "1px solid rgba(255,255,255,0.1)",
          display: "flex",
          flexDirection: "column",
          gap: "10px",
        }}
      >
        <button
          onClick={onExport}
          disabled={!hasHistory}
          style={{
            width: "100%",
            padding: "8px",
            background: "transparent",
            border: "1px solid #ffd700",
            color: "#ffd700",
            borderRadius: "4px",
            cursor: "pointer",
            opacity: hasHistory ? 1 : 0.5,
          }}
        >
          📥 导出名单
        </button>
        <button
          onClick={onReset}
          disabled={!hasHistory}
          style={{
            width: "100%",
            padding: "8px",
            background: "transparent",
            border: "1px solid #ff6b6b",
            color: "#ff6b6b",
            borderRadius: "4px",
            cursor: "pointer",
            opacity: hasHistory ? 1 : 0.5,
          }}
        >
          🔄 重新抽奖
        </button>
      </div>
    </div>
  );
};
