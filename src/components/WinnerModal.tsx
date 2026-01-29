// src/components/WinnerModal.tsx
import React from "react";
import type { Participant } from "../types";

interface Props {
  isOpen: boolean;
  prizeName: string;
  winners: Participant[];
  onClose: () => void;
}

export const WinnerModal: React.FC<Props> = ({
  isOpen,
  prizeName,
  winners,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal-content">
        <h2 className="modal-title">🎉 恭喜获得 {prizeName} 🎉</h2>

        <div className="winners-list">
          {winners.map((winner, index) => (
            <div key={winner.id || index} className="winner-tag">
              <div className="winner-info">
                <span className="winner-name">{winner.name}</span>
                <span className="winner-dept">({winner.department})</span>
              </div>

              {/* 【新增】如果有具体奖品，在这里显示 */}
              {winner.specificPrize && (
                <div className="winner-prize-detail">
                  🎁 {winner.specificPrize}
                </div>
              )}
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
