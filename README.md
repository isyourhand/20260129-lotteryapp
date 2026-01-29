现在要修改的是抽奖逻辑，
目前的抽奖逻辑是什么，分出五个奖，每个奖有不同的名额，最低的奖项抽二十个人，特等奖只抽一个，从最低的奖开始抽，抽中的人不再参与后续抽奖。
相关代码如下：
app.tsx 的代码你已经看过了，这里就不贴了。

```js
// src/services/lottery.ts
import type { Participant } from '../types';

/**
 * 随机洗牌算法 (Fisher-Yates Shuffle)
 */
const shuffle = <T>(array: T[]): T[] => {
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
};

/**
 * 抽取逻辑
 * @param pool 当前未中奖的人员池
 * @param count 要抽取的数量
 * @returns [中奖者列表, 剩余人员列表]
 */
export const drawWinners = (
  pool: Participant[],
  count: number
): [Participant[], Participant[]] => {
  // 防止抽取人数超过池子总数
  const safeCount = Math.min(count, pool.length);
  const shuffled = shuffle(pool);

  const winners = shuffled.slice(0, safeCount);
  const remaining = shuffled.slice(safeCount);

  return [winners, remaining];
};
```

```js
// lottery-app\src\components\LotteryPanel.tsx
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
```

```js
// src/types/index.ts

// 对应 Excel 中的每一行数据
export interface Participant {
  id: number | string; // 序号
  name: string; // 姓名
  department: string; // 部门
  revealing: 0 | 1;
}

// 奖项配置
export interface PrizeConfig {
  level: number; // 奖项级别 (如 1, 2, 3, 4, 5)
  name: string; // 奖项名称 (如 "三等奖", "特等奖")
  count: number; // 该奖项抽取人数
}

// 抽奖结果
export interface LotteryResult {
  prizeLevel: number;
  winners: Participant[];
}

export type LotteryState = "idle" | "rolling" | "revealing";

```

# 现在要修改成什么呢？

最新的奖项如下，

```xlsx
项目 奖品 数量
一等奖 HUAWEI平板 1
二等奖 小米手表 2
三等奖 小米手环 5
阳光普照奖 一日带薪假 5
红包 88元现金红包 5
幸运奖 “全家桶洗护套装 2
马上有福玩偶 1
马上有钱玩偶 1
美的养生壶 2
九阳破壁机 1
小米吹风机 1
小米充电宝 1
工位护腰靠枕 1
发热鼠标垫 1
户外露营桌椅折叠 1
苏泊尔电烤箱 1
户外帐篷 1
砂锅 1
小米体脂秤 1
颈部按摩枕 2
蓝牙自拍杆 1
马年公仔 1
刮刮乐&彩票 3”
```

可以看到现在多加了一个幸运奖，这个幸运奖的奖项不是固定的。
所以要修改的点就是，在这个新的奖项，新加一个逻辑，指定中奖人具体获取了什么奖励。
所以在卡片UI中，中奖人的卡片现在还要加上中了什么

---

目前的文件命名和文件路径
.gitignore
README.md
dist-electron/main.js
electron/main.ts
electron/preload.ts
eslint.config.js
index.html
package-lock.json
package.json
public/index.html
public/vite.svg
src/App.tsx
src/components/ControlBar.tsx
src/components/LotteryPanel.tsx
src/components/PrizeHeader.tsx
src/components/WinnerModal.tsx
src/hooks/useSpherePhysics.ts
src/main.tsx
src/services/lottery.ts
src/services/physicsUtils.ts
src/services/xlsx.ts
src/styles/main.css
src/types/index.ts
tsconfig.app.json
tsconfig.json
tsconfig.node.json
vite.config.ts
