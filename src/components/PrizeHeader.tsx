// src/components/PrizeHeader.tsx

import type { PrizeConfig } from '../types';

interface Props {
  // 这里允许 prize 为 undefined，防止刚加载时数据为空导致报错
  prize?: PrizeConfig; 
}

export default function PrizeHeader({ prize }: Props) {
  // 如果没有奖项数据，不渲染任何东西
  if (!prize) return null;

  return (
    <div className="prize-header" style={{ textAlign: 'center', marginBottom: '20px' }}>
      <h1 style={{ fontSize: '2.5rem', margin: '0', color: '#333' }}>
        {prize.name}
        <small style={{ fontSize: '1rem', color: '#666', marginLeft: '15px', fontWeight: 'normal' }}>
          (本轮抽取 {prize.count} 人)
        </small>
      </h1>
    </div>
  );
}