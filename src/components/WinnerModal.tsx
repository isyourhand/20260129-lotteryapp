// src/components/WinnerModal.tsx
import React, { useEffect, useState } from "react";
import type { Participant } from "../types";

interface Props {
  isOpen: boolean;
  poolName: string;
  winners: Participant[];
  isFirstPrize: boolean;
  onClose: () => void;
}

export const WinnerModal: React.FC<Props> = ({
  isOpen,
  poolName,
  winners,
  isFirstPrize,
  onClose,
}) => {
  const [showCards, setShowCards] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => setShowCards(true), 300);
      return () => clearTimeout(timer);
    } else {
      setShowCards(false);
    }
  }, [isOpen]);

  const count = winners.length;

  // 根据中奖人数计算卡片和弹窗尺寸（人数少卡片大，人数多卡片小）
  // 卡片大小减小10%，但字体保持不变
  const getCardSize = () => {
    if (count <= 1) return { width: 342, height: 234, fontSize: 2.8, gap: 60 };
    if (count <= 2) return { width: 288, height: 198, fontSize: 2.4, gap: 50 };
    if (count <= 3) return { width: 252, height: 171, fontSize: 2.2, gap: 40 };
    if (count <= 5) return { width: 198, height: 135, fontSize: 1.9, gap: 35 };
    if (count <= 8) return { width: 162, height: 108, fontSize: 1.6, gap: 30 };
    if (count <= 12) return { width: 135, height: 90, fontSize: 1.4, gap: 25 };
    return { width: 117, height: 81, fontSize: 1.2, gap: 20 }; // 13人及以上
  };

  const cardSize = getCardSize();

  // 计算弹窗尺寸 - 整体放大1.5倍，确保大家看得清楚
  const getModalSize = () => {
    // 根据人数计算列数，控制行数不要太多
    const cols = count <= 3 ? count : count <= 6 ? 3 : count <= 12 ? 4 : 6;
    const rows = Math.ceil(count / cols);
    const modalWidth = Math.max(600, cols * (cardSize.width + cardSize.gap * 0.8) + 150);
    const modalHeight = Math.max(500, rows * (cardSize.height + cardSize.gap) + 250);
    return { width: modalWidth, height: modalHeight };
  };

  const modalSize = getModalSize();

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop">
      <div
        className="modal-content"
        style={{
          width: `${modalSize.width}px`,
          minHeight: `${modalSize.height}px`,
        }}
      >
        <h2 className="modal-title">🎉 恭喜获得 {poolName} 🎉</h2>

        <div
          className="winners-list"
          style={{
            gap: `${cardSize.gap}px`,
          }}
        >
          {winners.map((winner, index) => (
            <div
              key={winner.id || index}
              className={`winner-flip-card ${showCards ? 'flipped' : ''}`}
              style={{
                animationDelay: `${index * 150}ms`,
                width: `${cardSize.width}px`,
                height: `${cardSize.height}px`,
                margin: `${cardSize.gap / 3}px`,
              }}
            >
              <div className="winner-flip-card-inner">
                {/* 卡片正面 - 问号 */}
                <div className="winner-flip-card-front">
                  <span
                    className="flip-question"
                    style={{ fontSize: `${cardSize.fontSize * 2.5}rem` }}
                  >
                    ?
                  </span>
                </div>
                {/* 卡片背面 - 中奖信息 */}
                <div className={`winner-flip-card-back ${isFirstPrize ? 'first-prize' : ''}`}>
                  <div
                    className="winner-name"
                    style={{ fontSize: `${cardSize.fontSize}rem` }}
                  >
                    {winner.name}
                  </div>
                  <div
                    className="winner-dept"
                    style={{ fontSize: `${cardSize.fontSize * 0.65}rem`, marginTop: '8px' }}
                  >
                    {winner.department}
                  </div>
                  {winner.specificPrize && (
                    <div
                      className="winner-prize-detail"
                      style={{ fontSize: `${cardSize.fontSize * 0.6}rem`, marginTop: '8px', paddingTop: '8px' }}
                    >
                      {winner.specificPrize}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <button className="btn-close" onClick={onClose}>
          继续抽奖
        </button>
      </div>
    </div>
  );
};
