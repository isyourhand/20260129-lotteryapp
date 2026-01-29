// src/hooks/useLottery.ts
// 抽奖游戏状态管理 Hook

import { useState, useRef, useEffect, useCallback } from "react";
import confetti from "canvas-confetti";
import { parseExcel, exportToExcel } from "../services/xlsx";
import { drawWinners, shuffle } from "../services/lottery";
import { calculateDynamics } from "../services/physicsUtils";
import type { Participant, PrizeConfig } from "../types";
import { PRIZES, STORAGE_KEY } from "../config/prizes";

type GameStatus = "idle" | "rolling" | "revealing";

export const useLotteryGame = () => {
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

  // 彩纸动画触发函数
  const triggerConfetti = useCallback(() => {
    const defaults = {
      origin: { y: 0.7 },
      zIndex: 10000,
    };

    const fire = (particleRatio: number, opts: confetti.Options) => {
      confetti({
        ...defaults,
        ...opts,
        particleCount: Math.floor(200 * particleRatio),
      });
    };

    fire(0.25, { spread: 26, startVelocity: 55 });
    fire(0.2, { spread: 60 });
    fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
    fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
    fire(0.1, { spread: 120, startVelocity: 45 });

    setTimeout(() => {
      confetti({
        origin: { y: 0.6 },
        particleCount: 100,
        spread: 100,
        colors: ["#ffd700", "#ff6b6b", "#4ecdc4", "#45b7d1", "#f9ca24"],
        zIndex: 10000,
      });
    }, 800);
  }, []);

  const finalize = useCallback((ws: Participant[], prize: PrizeConfig) => {
    const ids = new Set(ws.map((w) => w.id));
    setPool((p) => p.filter((x) => !ids.has(x.id)));
    setHistory((h) => ({ ...h, [prize.level]: ws }));
    setResult({ prize: prize.name, winners: ws });
    setStatus("idle");
    setPrizeIdx((i) => i - 1);
    triggerConfetti();
  }, [triggerConfetti]);

  const reveal = useCallback(
    (ws: Participant[], idx: number, prize: PrizeConfig) => {
      if (idx >= ws.length) {
        timer.current = window.setTimeout(() => finalize(ws, prize), 1000);
        return;
      }
      setWinners((prev) =>
        prev.map((w, i) => (i === idx ? { ...w, revealing: 1 } : w)),
      );
      const delay = 500 + (idx / ws.length) * 800;
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
    const [drawnRaw] = drawWinners(pool, prize.count);

    let drawn = drawnRaw;
    if (prize.items && prize.items.length > 0) {
      const shuffledGifts = shuffle(prize.items);
      drawn = drawnRaw.map((person, index) => ({
        ...person,
        specificPrize: shuffledGifts[index] || prize.name,
      }));
    } else {
      drawn = drawnRaw.map((p) => ({ ...p, specificPrize: prize.name }));
    }

    setFriction(calculateDynamics(drawn.length));
    setStatus("rolling");

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

  const downloadResults = useCallback(() => {
    exportToExcel(history, PRIZES);
  }, [history]);

  const clearAllData = useCallback(() => {
    if (
      window.confirm("确定要清空所有抽奖记录并重新开始吗？此操作不可恢复！")
    ) {
      setHistory({});
      setPool([]);
      setPrizeIdx(PRIZES.length - 1);
      localStorage.removeItem(STORAGE_KEY);
      window.location.reload();
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
    hasFile: pool.length > 0 || history[1]?.length !== undefined,
    downloadResults,
    clearAllData,
  };
};
