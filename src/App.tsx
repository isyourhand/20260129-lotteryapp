// src/App.tsx
import React, { useState, useRef, useEffect, useCallback } from "react";
import { parseExcel } from "./services/xlsx";
import { drawWinners } from "./services/lottery";
import type { Participant, PrizeConfig } from "./types";
import { LotteryPanel } from "./components/LotteryPanel";
import { WinnerModal } from "./components/WinnerModal";
import { calculateDynamics } from "./services/physicsUtils";
import "./styles/main.css";

const PRIZES: PrizeConfig[] = [
  { level: 1, name: "特等奖", count: 1 },
  { level: 2, name: "一等奖", count: 3 },
  { level: 3, name: "二等奖", count: 5 },
  { level: 4, name: "三等奖", count: 10 },
  { level: 5, name: "幸运奖", count: 20 },
];

type GameStatus = "idle" | "rolling" | "revealing";

const useLotteryGame = () => {
  const [pool, setPool] = useState<Participant[]>([]);
  const [prizeIdx, setPrizeIdx] = useState(PRIZES.length - 1);
  const [history, setHistory] = useState<Record<number, Participant[]>>({});
  const [status, setStatus] = useState<GameStatus>("idle");
  const [winners, setWinners] = useState<
    (Participant & { revealing?: number })[]
  >([]);
  const [result, setResult] = useState<{
    prize: string;
    winners: Participant[];
  } | null>(null);
  const [friction, setFriction] = useState(0.96);

  const timer = useRef<number>();

  useEffect(() => () => clearTimeout(timer.current), []);

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
    const [drawn] = drawWinners(pool, prize.count);

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

const Sidebar = ({
  active,
  history,
}: {
  active?: PrizeConfig;
  history: Record<number, Participant[]>;
}) => (
  <div className="sidebar">
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
);

export default function App() {
  const g = useLotteryGame();

  if (!g.hasFile)
    return (
      <div className="container">
        <UploadLayer onUpload={g.uploadFile} />
      </div>
    );

  return (
    <div className="container">
      <Sidebar active={g.activePrize} history={g.history} />

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
