// src/components/ControlBar.tsx
// 1. 定义类型接口
interface ControlBarProps {
  onStart: () => void; // 表示这是一个函数
  onStop: () => void;  // 表示这也是一个函数
}

// 2. 在组件参数中指定类型
export default function ControlBar({ onStart, onStop }: ControlBarProps) {
  return (
    <div className="control-bar">
      {/* 建议加个 div 包裹，方便后续写样式 */}
      <button onClick={onStart} className="btn-main">开始</button>
      <button onClick={onStop} className="btn-secondary" style={{marginLeft: '10px'}}>停止</button>
    </div>
  );
}