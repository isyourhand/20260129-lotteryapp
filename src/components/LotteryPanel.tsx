// lottery-app\src\components\LotteryPanel.tsx
import React, {
  useMemo,
  useRef,
  useState,
  useEffect,
  type CSSProperties,
} from "react";
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

// 安全的窗口尺寸获取 Hook
const useWindowSize = () => {
  const [size, setSize] = useState({ width: 1920, height: 1080 });

  useEffect(() => {
    // 只在客户端执行
    if (typeof window === "undefined") return;

    const updateSize = () => {
      setSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  return size;
};

export const LotteryPanel: React.FC<Props> = ({
  pool,
  lotteryState,
  currentWinners,
  friction,
  isFirstPrize = false,
}) => {
  const displayCount = Math.min(CONSTANTS.SPHERE_MAX, pool.length);

  // SSR 安全的窗口尺寸
  const { width: winWidth, height: winHeight } = useWindowSize();

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

  // ===================== Layer B: Winner Cards =====================
  // 计算球体参数
  const sphereParams = useMemo(() => {
    const radius = CONSTANTS.RADIUS.BASE + Math.sqrt(displayCount) * CONSTANTS.RADIUS.GROWTH;
    const goldenRatio = (1 + 5 ** 0.5) / 2;
    const yRange = displayCount < 30 ? 0.4 : displayCount < 60 ? 0.6 : 0.9;
    return { radius, goldenRatio, yRange };
  }, [displayCount]);

  // 计算卡片在球体上的位置
  const getCardSpherePosition = (index: number) => {
    const { radius, goldenRatio, yRange } = sphereParams;
    const k = -1 + (2 * index) / (displayCount - 1 || 1);
    const theta = (2 * Math.PI * index) / goldenRatio;
    const phi = Math.acos(-k * yRange);

    // 球坐标转笛卡尔坐标
    const x = radius * Math.sin(phi) * Math.cos(theta);
    const y = radius * Math.cos(phi);
    const z = radius * Math.sin(phi) * Math.sin(theta);

    return { x, y, z, theta, phi };
  };

  const winnerCards = useMemo(() => {
    // 基于总中奖人数计算固定布局，而不是仅基于已揭示的人数
    // 这样在抽奖过程中布局保持稳定，已有卡片不会跳动
    const totalWinners = currentWinners.length;
    if (!totalWinners) return null;

    // 右侧网格布局参数
    const marginRight = 30; // 右侧边距（像素）
    const gap = 12;
    const cardWidth = winWidth < 1400 ? 100 : 110; // 单列卡片宽度
    const rowHeight = 92;
    const topMargin = 80; // 顶部预留空间
    const bottomMargin = 40; // 底部预留空间
    const availableHeight = winHeight - topMargin - bottomMargin;
    const maxRows = Math.max(1, Math.floor(availableHeight / rowHeight));

    // 根据【总】中奖者数量计算列数，确保最终布局不超出屏幕
    const minCols = 2; // 最少2列
    const requiredCols = Math.ceil(totalWinners / maxRows);
    const cols = Math.max(minCols, requiredCols);

    // 计算网格总宽度
    const gridWidth = cols * cardWidth + (cols - 1) * gap;

    // 关键：最右侧卡片的中心位置 = 屏幕宽 - 右边距 - 卡片半宽
    const rightmostCardCenter = winWidth - marginRight - cardWidth / 2;

    // 垂直居中计算（基于总行数）
    const totalRows = Math.ceil(totalWinners / cols);
    const totalGridHeight = totalRows * rowHeight;
    const firstRowY = (winHeight - totalGridHeight) / 2 + rowHeight / 2;

    // 预计算所有中奖者的固定位置（按 originalIndex 排序）
    const positionMap = new Map<number, { x: number; y: number }>();
    for (let i = 0; i < totalWinners; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      // 从右向左排列：第0列在最右边
      const x = rightmostCardCenter - col * (cardWidth + gap);
      const y = firstRowY + row * rowHeight;
      positionMap.set(i, { x, y });
    }

    // 只渲染已揭示的中奖者，但使用预计算的固定位置
    return currentWinners
      .map((winner, originalIndex) => ({ winner, originalIndex }))
      .filter(({ winner }) => winner.revealing === 1)
      .map(({ winner, originalIndex }, revealedIndex) => {
        const pos = positionMap.get(originalIndex)!;
        const { x: targetX, y: targetY } = pos;

        // 找到中奖者在球体中的索引
        const sphereIndex = pool.findIndex((p) => p.id === winner.id);

        // 计算从球体位置飞出的偏移量
        let startOffsetX = winWidth / 2 - targetX;
        let startOffsetY = winHeight / 2 - targetY;
        let startScale = 0.5;

        if (sphereIndex >= 0) {
          const spherePos = getCardSpherePosition(sphereIndex);

          // 计算球体卡片在屏幕上的位置（相对于屏幕中心的偏移）
          // 加上当前缩放的影响
          const screenX = winWidth / 2 + spherePos.x * scale;
          const screenY = winHeight / 2 + spherePos.y * scale;

          // 计算从球体位置到目标位置的偏移
          startOffsetX = screenX - targetX;
          startOffsetY = screenY - targetY;

          // 根据球体的 z 轴深度计算缩放
          const perspective = 1500;
          const scaleFactor = perspective / (perspective - spherePos.z);
          startScale = Math.max(0.3, Math.min(1.2, scaleFactor * scale));
        }

        // 计算屏幕中央相对于目标位置的偏移量
        // 卡片飞到屏幕中央展示时，需要知道从目标位置到中央的偏移
        const centerOffsetX = winWidth / 2 - targetX;
        const centerOffsetY = winHeight / 2 - targetY;

        // 动画延迟：串行动画，每张卡片动画耗时 3.5 秒
        // 前一张卡片完全飞到右边后，下一张卡片才开始动画
        const ANIMATION_DURATION = 3500; // 3.5 秒
        const delay = revealedIndex * ANIMATION_DURATION;

        return (
        <div
          key={winner.id}
          className={`winner-card-static ${isFirstPrize ? "first-prize" : ""}`}
          style={
            {
              "--target-x": `${targetX}px`,
              "--target-y": `${targetY}px`,
              "--start-offset-x": `${startOffsetX}px`,
              "--start-offset-y": `${startOffsetY}px`,
              "--start-scale": String(startScale),
              "--center-offset-x": `${centerOffsetX}px`,
              "--center-offset-y": `${centerOffsetY}px`,
              "animation-delay": `${delay}ms`,
            } as CSSProperties
          }
        >
          <span className="card-name">{winner.name}</span>
          <div className="card-dept">{winner.department}</div>
          {winner.specificPrize && (
            <div className="card-prize-detail">{winner.specificPrize}</div>
          )}
        </div>
      );
    });
  }, [currentWinners, pool, sphereParams, displayCount, isFirstPrize, scale, winWidth, winHeight]);

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
