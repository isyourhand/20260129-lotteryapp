// src/components/Sidebar.tsx
// 侧边栏组件 - 新版：支持选择奖池和设置抽取数量

import React from "react";
import type { Participant, PrizePool } from "../types";

// 奖池图标映射
const PRIZE_ICONS: Record<string, string> = {
  first: "🏆", // 一等奖 - 奖杯
  second: "🥈", // 二等奖 - 银牌
  third: "🥉", // 三等奖 - 铜牌
  sunshine: "☀️", // 阳光普照奖 - 太阳
  "redpacket-1": "🧧", // 奋斗者红包
  "redpacket-2": "🧧", // 大吉大利红包
  "redpacket-3": "🧧", // 十周年锦鲤红包
  "redpacket-4": "🧧", // 新年红包
  blindbox: "❓", // 年会奖品/盲盒
  lucky: "🍀", // 幸运礼 - 四叶草
};

// 获取奖池图标
const getPrizeIcon = (pool: PrizePool): string => {
  if (pool.isFirstPrize) return "👑";
  return PRIZE_ICONS[pool.id] || "🎁";
};

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
  // 音频控制
  isMuted?: boolean;
  onToggleMute?: () => void;
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
  isMuted = false,
  onToggleMute,
}) => {
  const hasHistory = history.length > 0;

  // 获取奖池已抽取数量
  const getPoolDrawnCount = (poolId: string) => {
    return history
      .filter((h) => h.poolId === poolId)
      .reduce((sum, h) => sum + h.winners.length, 0);
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
              className={`prize-item ${isSelected ? "active" : ""} ${
                isEmpty ? "empty" : ""
              }`}
              onClick={() => !isEmpty && onSelectPool(pool.id)}
              style={{
                cursor: isEmpty ? "not-allowed" : "pointer",
                opacity: isEmpty ? 0.5 : 1,
              }}
            >
              <div className="prize-icon">{getPrizeIcon(pool)}</div>
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
        <div className="draw-count-section">
          <label>抽取数量</label>
          <div className="draw-count-input">
            <input
              type="number"
              min={1}
              max={maxDrawCount}
              value={drawCount}
              onChange={(e) => onSetDrawCount(parseInt(e.target.value) || 1)}
            />
            <span>最多 {maxDrawCount} 个</span>
          </div>
          <input
            type="range"
            className="draw-count-slider"
            min={1}
            max={maxDrawCount}
            value={drawCount}
            onChange={(e) => onSetDrawCount(parseInt(e.target.value))}
          />
        </div>
      )}

      {/* 底部按钮区域 */}
      <div className="sidebar-footer">
        {/* 开始抽奖按钮 */}
        <button className="btn-primary" onClick={onStart} disabled={!canStart}>
          {selectedPool ? `🎯 抽 ${selectedPool.name}` : "🎯 请先选择奖池"}
        </button>

        <button
          className="btn-secondary"
          onClick={onExport}
          disabled={!hasHistory}
        >
          📥 导出名单 ({history.length} 条记录)
        </button>
        <button className="btn-danger" onClick={onReset} disabled={!hasHistory}>
          🔄 重新抽奖
        </button>

        {/* 静音按钮 */}
        {onToggleMute && (
          <button
            className={`btn-mute ${isMuted ? "muted" : ""}`}
            onClick={onToggleMute}
            title={isMuted ? "取消静音" : "静音"}
          >
            {isMuted ? "🔇 已静音" : "🔊 声音开启"}
          </button>
        )}
      </div>
    </div>
  );
};
