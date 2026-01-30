// lottery-app\src\components\LotteryPanel.tsx
import React, { useMemo, useRef, useState, useEffect, type CSSProperties } from "react";
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
  isFirstPrize?: boolean;
}

export const LotteryPanel: React.FC<Props> = ({
  pool,
  lotteryState,
  currentWinners,
  friction,
  isFirstPrize = false,
}) => {
  const displayCount = Math.min(CONSTANTS.SPHERE_MAX, pool.length);

  // 1. 创建物理容器的 Ref
  const sphereRef = useRef<HTMLDivElement>(null);

  // 2. 接入物理引擎 (核心修改)
  // 这会让 sphereRef 指向的 div 根据 state 进行丝滑的加减速旋转
  useSpherePhysics(sphereRef, lotteryState, friction);

  // 3. 鼠标滚轮缩放功能
  const [scale, setScale] = useState(1);
  const canvasAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      setScale((prev) => {
        const newScale = prev + delta;
        return Math.max(0.3, Math.min(2.5, newScale));
      });
    };

    const canvasArea = canvasAreaRef.current;
    if (canvasArea) {
      canvasArea.addEventListener("wheel", handleWheel, { passive: false });
    }

    return () => {
      if (canvasArea) {
        canvasArea.removeEventListener("wheel", handleWheel);
      }
    };
  }, []);

  const winnerMap = useMemo(
    () => new Map(currentWinners.map((w) => [w.id, w.revealing ?? 0])),
    [currentWinners],
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

      // 判断是否是一等奖中奖卡片
      const isFirstPrizeWinner = isFirstPrize && isRevealed;

      return (
        <div
          key={p.id}
          className={`lottery-card ${isRevealed ? "revealing-winner" : ""} ${isFirstPrizeWinner ? "first-prize" : ""}`}
          style={{ transform }}
        >
          <span className="card-name">{p.name}</span>
          <div className="card-dept">{p.department}</div>
        </div>
      );
    });
  }, [pool, displayCount, winnerMap, isFirstPrize]);

  // ===================== Layer B: Winner Cards (保持不变) =====================
  const winnerCards = useMemo(() => {
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
          className={`winner-card-static ${isFirstPrize ? 'first-prize' : ''}`}
          style={
            {
              "--tx": `calc(44vw - 60px + ${tx}px)`,
              "--ty": `${ty}px`,
            } as CSSProperties
          }
        >
          <span className="card-name" style={{ fontSize: "1.2rem" }}>
            {winner.name}
          </span>
          <div className="card-dept">{winner.department}</div>
          {winner.specificPrize && (
            <div
              className="card-prize-detail"
              style={{
                marginTop: "4px",
                fontSize: "0.8rem",
                color: "#ffd700", // 金色字体突出奖品
                fontWeight: "bold",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                maxWidth: "100%",
              }}
            >
              {winner.specificPrize}
            </div>
          )}
        </div>
      );
    });
  }, [currentWinners]);

  return (
    <>
      <div className="canvas-area" ref={canvasAreaRef}>
        {/* 缩放包装层：使用 wrapper 应用缩放，避免与 sphere-container 的旋转冲突 */}
        <div
          className="sphere-scale-wrapper"
          style={{
            transform: `scale(${scale})`,
            transformOrigin: "center center",
          }}
        >
          {/* 核心修改：
              1. 移除了 className 中的 idle/running 状态类
              2. 绑定 ref 给 useSpherePhysics 控制
              3. style 中移除 transform，完全由 JS 接管
          */}
          <div className="sphere-container" ref={sphereRef}>
            {sphereCards}
          </div>
        </div>
      </div>
      <div className="winner-layer">{winnerCards}</div>
    </>
  );
};
