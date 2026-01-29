// src/App.tsx
import React, { useState, useRef, useEffect, useCallback } from "react";
import { parseExcel, exportToExcel } from "./services/xlsx";
import { drawWinners, shuffle } from "./services/lottery";
import type { Participant, PrizeConfig } from "./types";
import { LotteryPanel } from "./components/LotteryPanel";
import { WinnerModal } from "./components/WinnerModal";
import { calculateDynamics } from "./services/physicsUtils";
import "./styles/main.css";

// --- 辅助函数：展开礼物列表 ---
// 输入: generateItems(["玩偶", 2], ["水杯", 1]) -> ["玩偶", "玩偶", "水杯"]
const generateItems = (...items: [string, number][]): string[] => {
  return items.flatMap(([name, count]) => Array(count).fill(name));
};

// --- Configuration ---
// 根据你的需求构建幸运奖池
const RAW_LUCKY_POOL = generateItems(
  ["全家桶洗护套装", 2],
  ["马上有福玩偶", 1],
  ["马上有钱玩偶", 1],
  ["美的养生壶", 2],
  ["九阳破壁机", 1],
  ["小米吹风机", 1],
  ["小米充电宝", 1],
  ["工位护腰靠枕", 1],
  ["发热鼠标垫", 1],
  ["户外露营桌椅折叠", 1],
  ["苏泊尔电烤箱", 1],
  ["户外帐篷", 1],
  ["砂锅", 1],
  ["小米体脂秤", 1],
  ["颈部按摩枕", 2],
  ["蓝牙自拍杆", 1],
  ["马年公仔", 1],
  ["刮刮乐&彩票", 3],
);

// 2. 【关键】预先洗牌，保证两轮奖品的随机性
// 注意：这里在模块加载时执行一次。如果希望每次刷新页面都变，这样写没问题。
const SHUFFLED_LUCKY_POOL = shuffle(RAW_LUCKY_POOL);

// 3. 切分奖池
const LUCKY_ROUND_1 = SHUFFLED_LUCKY_POOL.slice(0, 13); // 前13个
const LUCKY_ROUND_2 = SHUFFLED_LUCKY_POOL.slice(13); // 剩下的(10个)

// 4. 配置奖项列表
const PRIZES: PrizeConfig[] = [
  {
    level: 1,
    name: "一等奖",
    count: 1,
    items: ["HUAWEI 平板"], // 单个也是数组
  },
  {
    level: 2,
    name: "二等奖",
    count: 2,
    items: generateItems(["小米手表", 2]), // 生成 ["小米手表", "小米手表"]
  },
  {
    level: 3,
    name: "三等奖",
    count: 5,
    items: generateItems(["小米手环", 5]),
  },
  {
    level: 4,
    name: "阳光普照奖",
    count: 5,
    items: generateItems(["一日带薪假", 5]),
  },
  {
    level: 5,
    name: "新年红包",
    count: 5,
    items: generateItems(["88元现金红包", 5]),
  },
  {
    level: 6,
    name: "幸运奖 (第二轮)",
    count: LUCKY_ROUND_2.length,
    items: LUCKY_ROUND_2,
  },
  {
    level: 7,
    name: "幸运奖 (第一轮)",
    count: LUCKY_ROUND_1.length,
    items: LUCKY_ROUND_1,
  },
];

type GameStatus = "idle" | "rolling" | "revealing";

const STORAGE_KEY = "LOTTERY_HISTORY_V1";

const useLotteryGame = () => {
  const [pool, setPool] = useState<Participant[]>([]);
  const [prizeIdx, setPrizeIdx] = useState(PRIZES.length - 1);
  const [status, setStatus] = useState<GameStatus>("idle");
  const [winners, setWinners] = useState<
    (Participant & { revealing?: number })[]
  >([]);
  const [result, setResult] = useState<{
    prize: string;
    winners: Participant[];
  } | null>(null);
  const [friction, setFriction] = useState(0.96);
  const [history, setHistory] = useState<Record<number, Participant[]>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      console.error("读取历史记录失败", e);
      return {};
    }
  });

  const timer = useRef<number>();

  useEffect(() => () => clearTimeout(timer.current), []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  }, [history]);

  const uploadFile = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setPool(await parseExcel(file));
    },
    [],
  );

  const finalize = useCallback((ws: Participant[], prize: PrizeConfig) => {
    const ids = new Set(ws.map((w) => w.id));
    setPool((p) => p.filter((x) => !ids.has(x.id)));
    setHistory((h) => ({ ...h, [prize.level]: ws }));
    setResult({ prize: prize.name, winners: ws });
    setStatus("idle");
    setPrizeIdx((i) => i - 1);
  }, []);

  // 核心：变速揭晓重构为扁平递归，移除冗余参数
  const reveal = useCallback(
    (ws: Participant[], idx: number, prize: PrizeConfig) => {
      if (idx >= ws.length) {
        timer.current = window.setTimeout(() => finalize(ws, prize), 1000);
        return;
      }
      setWinners((prev) =>
        prev.map((w, i) => (i === idx ? { ...w, revealing: 1 } : w)),
      );
      const delay = 500 + (idx / ws.length) * 800; // 线性缓动
      timer.current = window.setTimeout(
        () => reveal(ws, idx + 1, prize),
        delay,
      );
    },
    [finalize],
  );

  const start = useCallback(() => {
    if (prizeIdx < 0) return alert("所有奖项已抽完");
    if (status !== "idle") return;

    const prize = PRIZES[prizeIdx];
    // 1. 抽人
    const [drawnRaw] = drawWinners(pool, prize.count);

    // 2. [核心修改] 分配具体奖品逻辑
    let drawn = drawnRaw;
    if (prize.items && prize.items.length > 0) {
      // 这里的 shuffle 对于全是一样的礼物(如5个手环)没影响，
      // 但对于幸运奖(盲盒)至关重要。统一执行，代码更少。
      const shuffledGifts = shuffle(prize.items);

      drawn = drawnRaw.map((person, index) => ({
        ...person,
        // 核心：绑定具体物品。如果配置配错了没填items，就兜底显示奖项名
        specificPrize: shuffledGifts[index] || prize.name,
      }));
    } else {
      // 防御性代码：万一 items 为空，至少把奖项名填进去
      drawn = drawnRaw.map((p) => ({ ...p, specificPrize: prize.name }));
    }

    setFriction(calculateDynamics(drawn.length));
    setStatus("rolling");

    // 物理加速等待期
    timer.current = window.setTimeout(() => {
      setWinners(drawn.map((w) => ({ ...w, revealing: 0 })));
      setStatus("revealing");
      reveal(drawn, 0, prize);
    }, 1500);
  }, [status, prizeIdx, pool, reveal]);

  const reset = useCallback(() => {
    setResult(null);
    setWinners([]);
  }, []);

  // 3. 【新增】导出功能
  const downloadResults = useCallback(() => {
    exportToExcel(history, PRIZES);
  }, [history]);

  // 4. 【新增】重置功能（危险操作需谨慎）
  // 清空数据的同时，也要清空 localStorage
  const clearAllData = useCallback(() => {
    if (
      window.confirm("确定要清空所有抽奖记录并重新开始吗？此操作不可恢复！")
    ) {
      setHistory({});
      setPool([]); // 或者保留 pool，取决于你的需求，这里假设完全重置
      setPrizeIdx(PRIZES.length - 1);
      localStorage.removeItem(STORAGE_KEY);
      window.location.reload(); // 简单粗暴刷新页面，重置所有状态
    }
  }, []);

  return {
    pool,
    prizeIdx,
    history,
    status,
    winners,
    result,
    friction,
    uploadFile,
    start,
    reset,
    activePrize: PRIZES[prizeIdx],
    hasFile: pool.length > 0 || history[1]?.length !== undefined, // 简化文件加载判断
    downloadResults, // 暴露给 View
    clearAllData, // 暴露给 View
  };
};

// 视图组件内联简化，移除冗余类型声明
const UploadLayer = ({
  onUpload,
}: {
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) => (
  <div
    className="upload-layer"
    style={{
      color: "white",
      textAlign: "center",
      paddingTop: "20vh",
      position: "relative",
      zIndex: 200,
    }}
  >
    <h1>导入数据启动系统</h1>
    <input type="file" accept=".xlsx,.xls" onChange={onUpload} />
  </div>
);
// 1. 先更新 Sidebar 的定义，让它能接收 onExport 属性
// ---------------------------------------------------
const Sidebar = ({
  active,
  history,
  onExport, // <--- 新增这个属性
}: {
  active?: PrizeConfig;
  history: Record<number, Participant[]>;
  onExport: () => void; // <--- 定义类型
}) => (
  <div className="sidebar">
    <div className="prize-list">
      {PRIZES.map((p) => (
        <div
          key={p.level}
          className={`prize-item ${active?.level === p.level ? "active" : ""}`}
        >
          <div className="prize-icon" />
          <div className="prize-info">
            <h3>{p.name}</h3>
            <span>
              已抽取: {history[p.level]?.length ?? 0} / {p.count}
            </span>
          </div>
        </div>
      ))}
    </div>

    {/* 底部导出按钮 */}
    <div
      className="sidebar-footer"
      style={{
        padding: "20px",
        marginTop: "auto",
        borderTop: "1px solid rgba(255,255,255,0.1)",
      }}
    >
      <button
        onClick={onExport}
        disabled={Object.keys(history).length === 0}
        style={{
          width: "100%",
          padding: "8px",
          background: "transparent",
          border: "1px solid #ffd700",
          color: "#ffd700",
          borderRadius: "4px",
          cursor: "pointer",
          opacity: Object.keys(history).length === 0 ? 0.5 : 1,
        }}
      >
        📥 导出名单
      </button>
    </div>
  </div>
);

// 2. 修正后的主组件
// ---------------------------------------------------
export default function App() {
  // 只调用一次 hook，拿到所有能力
  const g = useLotteryGame();

  // 如果没有文件，显示上传层
  if (!g.hasFile) {
    return (
      <div className="container">
        <UploadLayer onUpload={g.uploadFile} />
      </div>
    );
  }

  // 正常显示主界面
  return (
    <div className="container">
      <Sidebar
        active={g.activePrize}
        history={g.history}
        onExport={g.downloadResults} // <--- 这里把导出方法传进去
      />

      <LotteryPanel
        pool={g.pool}
        lotteryState={g.status}
        currentWinners={g.winners}
        friction={g.friction}
      />

      <div className="control-bar">
        <button
          className="btn-start"
          onClick={g.start}
          disabled={g.status !== "idle" || !!g.result || g.prizeIdx < 0}
        >
          {g.status === "revealing" ? "抽奖中..." : "开始抽奖"}
        </button>
      </div>

      <WinnerModal
        isOpen={!!g.result}
        prizeName={g.result?.prize ?? ""}
        winners={g.result?.winners ?? []}
        onClose={g.reset}
      />
    </div>
  );
}
