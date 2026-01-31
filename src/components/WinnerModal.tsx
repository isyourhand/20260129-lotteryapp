// src/components/WinnerModal.tsx
import React, { useEffect, useRef, useState } from "react";
import { CARD_ANIMATION, LOTTERY_FLOW } from "../config/animation";
import { bgMusic } from "../services/backgroundMusic";
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
  const count = winners.length;
  const flippedCountRef = useRef(0);

  useEffect(() => {
    if (isOpen) {
      // 播放中奖弹窗音效 (4.wav)
      bgMusic.playWinModal();

      // 弹窗在所有外部卡片动画完成后才显示（isOpen 才变为 true）
      // 弹窗出现后，内部问号卡片应该很快开始翻转
      // 使用 LOTTERY_FLOW.FLIP_DELAY 让弹窗先稳定显示，然后开始翻转动画
      const timer = setTimeout(
        () => setShowCards(true),
        LOTTERY_FLOW.FLIP_DELAY,
      );
      return () => clearTimeout(timer);
    } else {
      setShowCards(false);
      flippedCountRef.current = 0;
    }
  }, [isOpen]);

  // 卡片翻转处理（音效已移除）
  const handleFlip = (index: number) => {
    // 只在卡片真正开始翻转时计数
    if (showCards && index >= flippedCountRef.current) {
      flippedCountRef.current = index + 1;
    }
  };

  // 智能计算卡片布局 - 基于视口和人数自动优化
  const getLayout = () => {
    // 视口可用空间（预留边距）
    const viewportWidth =
      typeof window !== "undefined" ? window.innerWidth * 0.9 : 1200;
    const viewportHeight =
      typeof window !== "undefined" ? window.innerHeight * 0.8 : 800;

    // 卡片宽高比
    const cardRatio = 1.5; // 宽:高 = 1.5:1

    // 根据人数智能计算列数 - 目标是让卡片分布更均匀，接近正方形
    let cols: number;
    if (count <= 1) cols = 1;
    else if (count <= 2) cols = 2;
    else if (count <= 4) cols = 2;
    else if (count <= 6) cols = 3;
    else if (count <= 9) cols = 3;
    else if (count <= 12) cols = 4;
    else if (count <= 16) cols = 4;
    else if (count <= 20) cols = 5;
    else if (count <= 25) cols = 5;
    else cols = 6;

    const rows = Math.ceil(count / cols);

    // 计算每个卡片可用的最大空间（考虑间距）
    const gap = Math.max(16, Math.min(24, 120 / count)); // 间距随人数增加而减小，但有最小值
    const availableWidth = (viewportWidth - 100) / cols - gap;
    const availableHeight = (viewportHeight - 200) / rows - gap;

    // 根据可用空间计算卡片尺寸，保持比例
    let cardWidth = Math.min(availableWidth, availableHeight * cardRatio);
    let cardHeight = cardWidth / cardRatio;

    // 限制卡片最大最小尺寸
    const maxWidth = 200;
    const minWidth = 130;
    const maxHeight = 150;
    const minHeight = 95;

    cardWidth = Math.max(minWidth, Math.min(maxWidth, cardWidth));
    cardHeight = Math.max(minHeight, Math.min(maxHeight, cardHeight));

    // 如果按宽度计算的高度超出限制，按高度反推宽度
    if (cardHeight > maxHeight) {
      cardHeight = maxHeight;
      cardWidth = cardHeight * cardRatio;
    } else if (cardHeight < minHeight) {
      cardHeight = minHeight;
      cardWidth = cardHeight * cardRatio;
    }

    // 字体大小计算 - 基于卡片宽度，但有最小值保证可读性
    const baseFontSize = cardWidth / 120; // 基准字体比例
    const fontSize = Math.max(1.1, Math.min(2.8, baseFontSize * 1.2));

    // 弹窗尺寸 - 根据实际卡片布局计算，确保最小宽度能容纳标题
    const calculatedWidth = cols * (cardWidth + gap) + 80;
    const minWidthForTitle = 420; // 确保标题能完整显示的最小宽度
    const modalWidth = Math.min(
      viewportWidth,
      Math.max(calculatedWidth, minWidthForTitle),
    );
    const modalHeight = Math.min(
      viewportHeight,
      rows * (cardHeight + gap) + 180,
    );

    return {
      cardWidth: Math.round(cardWidth),
      cardHeight: Math.round(cardHeight),
      fontSize: Math.round(fontSize * 10) / 10,
      gap: Math.round(gap),
      cols,
      rows,
      modalWidth: Math.round(modalWidth),
      modalHeight: Math.round(modalHeight),
    };
  };

  const layout = getLayout();

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop">
      <div
        className="modal-content"
        style={{
          width: `${layout.modalWidth}px`,
          minHeight: `${layout.modalHeight}px`,
        }}
      >
        <h2 className="modal-title">🎉 恭喜获得 {poolName} 🎉</h2>

        <div
          className="winners-list"
          style={{
            gap: `${layout.gap}px`,
            gridTemplateColumns: `repeat(${layout.cols}, auto)`,
          }}
        >
          {winners.map((winner, index) => (
            <div
              key={winner.id || index}
              className={`winner-flip-card ${showCards ? "flipped" : ""}`}
              style={{
                animationDelay: `${index * LOTTERY_FLOW.FLIP_INTERVAL}ms`,
                width: `${layout.cardWidth}px`,
                height: `${layout.cardHeight}px`,
              }}
              onTransitionEnd={() => handleFlip(index)}
            >
              <div className="winner-flip-card-inner">
                {/* 卡片正面 - 问号 */}
                <div className="winner-flip-card-front">
                  <span
                    className="flip-question"
                    style={{
                      fontSize: `${Math.min(layout.cardWidth * 0.4, 80)}px`,
                    }}
                  >
                    ?
                  </span>
                </div>
                {/* 卡片背面 - 中奖信息 */}
                <div
                  className={`winner-flip-card-back ${isFirstPrize ? "first-prize" : ""}`}
                >
                  <div
                    className="winner-name"
                    style={{ fontSize: `${layout.fontSize}rem` }}
                  >
                    {winner.name}
                  </div>
                  <div
                    className="winner-dept"
                    style={{
                      fontSize: `${Math.max(0.8, layout.fontSize * 0.55)}rem`,
                      marginTop: "1px",
                    }}
                  >
                    {winner.department}
                  </div>
                  {winner.specificPrize && (
                    <div
                      className="winner-prize-detail"
                      style={{
                        fontSize: `${Math.max(0.7, layout.fontSize * 0.5)}rem`,
                        marginTop: "6px",
                        paddingTop: "6px",
                      }}
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
