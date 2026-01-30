// src/components/Sidebar.tsx
// 侧边栏组件 - 新版：支持选择奖池和设置抽取数量

import React, { useState } from "react";
import type { Participant, PrizePool } from "../types";

interface Props {
  prizePools: PrizePool[];
  selectedPool: PrizePool | null;
  drawCount: number;
  maxDrawCount: number;
  history: { poolId: string; poolName: string; winners: Participant[] }[];
  canStart: boolean;
  onSelectPool: (poolId: string) => void;
  onSetDrawCount: (count: number) => void;
  onStart: () => void;
  onExport: () => void;
  onReset: () => void;
}

export const Sidebar: React.FC<Props> = ({
  prizePools,
  selectedPool,
  drawCount,
  maxDrawCount,
  history,
  canStart,
  onSelectPool,
  onSetDrawCount,
  onStart,
  onExport,
  onReset,
}) => {
  const hasHistory = history.length > 0;

  // 获取奖池已抽取数量
  const getPoolDrawnCount = (poolId: string) => {
    return history.filter((h) => h.poolId === poolId).reduce((sum, h) => sum + h.winners.length, 0);
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h2>奖池选择</h2>
      </div>

      {/* 奖池列表 */}
      <div className="prize-list">
        {prizePools.map((pool) => {
          const drawn = getPoolDrawnCount(pool.id);
          const remaining = pool.items.length - drawn;
          const isSelected = selectedPool?.id === pool.id;
          const isEmpty = remaining <= 0;

          return (
            <div
              key={pool.id}
              className={`prize-item ${isSelected ? "active" : ""} ${isEmpty ? "empty" : ""}`}
              onClick={() => !isEmpty && onSelectPool(pool.id)}
              style={{
                cursor: isEmpty ? "not-allowed" : "pointer",
                opacity: isEmpty ? 0.5 : 1,
              }}
            >
              <div className="prize-icon">
                {pool.isFirstPrize ? "👑" : "🎁"}
              </div>
              <div className="prize-info">
                <h3>{pool.name}</h3>
                <span>
                  剩余: {remaining} / {pool.items.length}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* 抽取数量设置 */}
      {selectedPool && (
        <div
          className="draw-count-section"
          style={{
            padding: "16px 20px",
            borderTop: "1px solid rgba(255,255,255,0.1)",
            borderBottom: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          <label
            style={{
              display: "block",
              color: "#ffd700",
              fontSize: "0.9rem",
              marginBottom: "8px",
              fontWeight: 500,
            }}
          >
            抽取数量
          </label>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <input
              type="number"
              min={1}
              max={maxDrawCount}
              value={drawCount}
              onChange={(e) => onSetDrawCount(parseInt(e.target.value) || 1)}
              style={{
                width: "80px",
                padding: "10px",
                background: "rgba(255,255,255,0.1)",
                border: "1px solid rgba(255,215,0,0.3)",
                borderRadius: "6px",
                color: "#fff",
                fontSize: "1rem",
                textAlign: "center",
              }}
            />
            <span style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.85rem" }}>
              最多 {maxDrawCount} 个
            </span>
          </div>
          <input
            type="range"
            min={1}
            max={maxDrawCount}
            value={drawCount}
            onChange={(e) => onSetDrawCount(parseInt(e.target.value))}
            style={{
              width: "100%",
              marginTop: "10px",
              accentColor: "#ffd700",
            }}
          />
        </div>
      )}

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
        {/* 开始抽奖按钮 */}
        <button
          onClick={onStart}
          disabled={!canStart}
          style={{
            width: "100%",
            padding: "12px",
            background: canStart ? "#ffd700" : "transparent",
            border: "2px solid #ffd700",
            color: canStart ? "#0a0a18" : "#ffd700",
            borderRadius: "8px",
            cursor: canStart ? "pointer" : "not-allowed",
            opacity: canStart ? 1 : 0.5,
            fontSize: "1rem",
            fontWeight: "bold",
            letterSpacing: "2px",
            transition: "all 0.3s ease",
          }}
        >
          {selectedPool ? `🎯 抽 ${selectedPool.name}` : "🎯 请先选择奖池"}
        </button>

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
          📥 导出名单 ({history.length} 条记录)
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
}
