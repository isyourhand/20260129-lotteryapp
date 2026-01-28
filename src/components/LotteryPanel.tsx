import React, { useMemo, useRef, type CSSProperties } from "react";
import type { Participant, LotteryState } from "../types";
import { useSpherePhysics } from "../hooks/useSpherePhysics"; // 引入刚才写的 hook

const CONSTANTS = {
  SPHERE_MAX: 120,
  GRID: { W: 150, H: 80, COLS: 2 },
  RADIUS: { BASE: 180, GROWTH: 15 },
};

interface Props {
  pool: Participant[];
  lotteryState: LotteryState;
  currentWinners: Participant[];
  friction: number;
}

export const LotteryPanel: React.FC<Props> = ({
  pool,
  lotteryState,
  currentWinners,
  friction,
}) => {
  const displayCount = Math.min(CONSTANTS.SPHERE_MAX, pool.length);

  // 1. 创建物理容器的 Ref
  const sphereRef = useRef<HTMLDivElement>(null);

  // 2. 接入物理引擎 (核心修改)
  // 这会让 sphereRef 指向的 div 根据 state 进行丝滑的加减速旋转
  useSpherePhysics(sphereRef, lotteryState, friction);

  const winnerMap = useMemo(
    () => new Map(currentWinners.map((w) => [w.id, w.revealing ?? 0])),
    [currentWinners]
  );

  // ===================== Layer A: 3D Sphere =====================
  const sphereCards = useMemo(() => {
    if (!pool.length) return [];
    const radius =
      CONSTANTS.RADIUS.BASE + Math.sqrt(displayCount) * CONSTANTS.RADIUS.GROWTH;
    const goldenRatio = (1 + 5 ** 0.5) / 2;
    const yRange = displayCount < 30 ? 0.4 : displayCount < 60 ? 0.6 : 0.9;

    return pool.slice(0, displayCount).map((p, i) => {
      const isRevealed = winnerMap.get(p.id) === 1;
      const k = -1 + (2 * i) / (displayCount - 1 || 1);
      const theta = (2 * Math.PI * i) / goldenRatio;
      const phi = Math.acos(-k * yRange);

      // 注意：这里只处理每个卡片相对于球心的静态位置 (rotateX, translateZ)
      // 整体的 rotateY 交给父容器 sphereRef 动态控制
      const transform = `rotateY(${(theta * 180) / Math.PI}deg) rotateX(${
        (phi * 180) / Math.PI - 90
      }deg) translateZ(${radius}px)`;

      return (
        <div
          key={p.id}
          className={`lottery-card ${isRevealed ? "revealing-winner" : ""}`}
          style={{ transform }}
        >
          <span className="card-name">{p.name}</span>
          <div className="card-dept">{p.department}</div>
        </div>
      );
    });
  }, [pool, displayCount, winnerMap]);

  // ===================== Layer B: Winner Cards (保持不变) =====================
  const winnerCards = useMemo(() => {
    // ... (代码与上一版相同，此处省略以节省篇幅) ...
    // 请保持之前的 Winner Cards 逻辑
    const revealedWinners = currentWinners.filter((w) => w.revealing === 1);
    const total = currentWinners.length;
    if (!total) return null;
    const cols = Math.min(CONSTANTS.GRID.COLS, Math.ceil(Math.sqrt(total)));
    const totalRows = Math.ceil(total / cols);

    return revealedWinners.map((winner) => {
      const index = currentWinners.findIndex((w) => w.id === winner.id);
      const row = Math.floor(index / cols);
      const col = index % cols;
      const currentRowCount =
        row === totalRows - 1 && total % cols !== 0 ? total % cols : cols;
      const tx = (col - (currentRowCount - 1) / 2) * CONSTANTS.GRID.W;
      const ty = (row - (totalRows - 1) / 2) * CONSTANTS.GRID.H;
      return (
        <div
          key={winner.id}
          className="winner-card-static"
          style={
            {
              "--tx": `calc(32vw + ${tx}px)`,
              "--ty": `${ty}px`,
            } as CSSProperties
          }
        >
          <span className="card-name" style={{ fontSize: "1.2rem" }}>
            {winner.name}
          </span>
          <div className="card-dept">{winner.department}</div>
        </div>
      );
    });
  }, [currentWinners]);

  return (
    <>
      <div className="canvas-area">
        {/* 核心修改：
            1. 移除了 className 中的 idle/running 状态类
            2. 绑定 ref 给 useSpherePhysics 控制
            3. style 中移除 transform，完全由 JS 接管
        */}
        <div className="sphere-container" ref={sphereRef}>
          {sphereCards}
        </div>
      </div>
      <div className="winner-layer">{winnerCards}</div>
    </>
  );
};
