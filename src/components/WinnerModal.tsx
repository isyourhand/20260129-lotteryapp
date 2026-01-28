// src/components/WinnerModal.tsx
import React from 'react';
import type { Participant } from '../types';

interface Props {
  isOpen: boolean;
  prizeName: string;
  winners: Participant[];
  onClose: () => void;
}

export const WinnerModal: React.FC<Props> = ({ isOpen, prizeName, winners, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal-content">
        <h2 className="modal-title">🎉 恭喜获得 {prizeName} 🎉</h2>
        
        <div className="winners-list">
          {winners.map((winner, index) => (
            <div key={winner.id || index} className="winner-tag">
              {winner.name} 
              <span style={{fontSize: '0.8em', opacity: 0.7, marginLeft: '5px'}}>
                ({winner.department})
              </span>
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