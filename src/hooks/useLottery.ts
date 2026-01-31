// src/hooks/useLottery.ts
// 抽奖游戏状态管理 Hook - 新版：支持自由选择奖池和数量

import { useState, useRef, useEffect, useCallback } from "react";
import confetti from "canvas-confetti";
import { parseExcel, exportToExcel } from "../services/xlsx";
import { drawWinners, shuffle } from "../services/lottery";
import { calculateDynamics } from "../services/physicsUtils";
import { bgMusic } from "../services/backgroundMusic";
import type { Participant, PrizePool, LotteryResult } from "../types";
import { PRIZE_POOLS, STORAGE_KEY } from "../config/prizes";
import { CARD_ANIMATION, LOTTERY_FLOW } from "../config/animation";

type GameStatus = "idle" | "rolling" | "revealing";

// 历史记录结构
interface HistoryRecord {
  poolId: string;
  poolName: string;
  winners: Participant[];
  timestamp: number;
}

export const useLotteryGame = () => {
  const [pool, setPool] = useState<Participant[]>([]);
  const [status, setStatus] = useState<GameStatus>("idle");
  const [winners, setWinners] = useState<
    (Participant & { revealing?: number })[]
  >([]);
  const [result, setResult] = useState<{
    poolName: string;
    winners: Participant[];
    isFirstPrize: boolean;
  } | null>(null);
  const [friction, setFriction] = useState(0.96);

  // 当前选中的奖池
  const [selectedPool, setSelectedPool] = useState<PrizePool | null>(null);
  // 抽取数量
  const [drawCount, setDrawCount] = useState(1);

  // 所有奖池状态（跟踪每个奖池剩余奖品）
  const [prizePools, setPrizePools] = useState<PrizePool[]>(PRIZE_POOLS);

  // 历史记录
  const [history, setHistory] = useState<HistoryRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("读取历史记录失败", e);
      return [];
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
      const participants = await parseExcel(file);
      setPool(participants);
      // 上传成功后开始播放背景音乐
      if (participants.length > 0) {
        bgMusic.playIdle();
      }
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

  // 选择奖池
  const selectPool = useCallback(
    (poolId: string) => {
      const pool = prizePools.find((p) => p.id === poolId);
      if (pool) {
        setSelectedPool(pool);
        // 默认抽取数量：不超过剩余奖品数和参与人数
        setDrawCount(1);
      }
    },
    [prizePools],
  );

  // 设置抽取数量
  const setDrawQuantity = useCallback((count: number) => {
    setDrawCount(Math.max(1, Math.min(count, 50))); // 限制1-50
  }, []);

  const finalize = useCallback(
    (ws: Participant[], pool: PrizePool, drawnItems: string[]) => {
      const ids = new Set(ws.map((w) => w.id));
      setPool((p) => p.filter((x) => !ids.has(x.id)));

      // 更新奖池状态
      setPrizePools((prev) =>
        prev.map((p) =>
          p.id === pool.id ? { ...p, drawnCount: p.drawnCount + ws.length } : p,
        ),
      );

      // 添加到历史记录
      const record: HistoryRecord = {
        poolId: pool.id,
        poolName: pool.name,
        winners: ws,
        timestamp: Date.now(),
      };
      setHistory((h) => [...h, record]);

      setResult({
        poolName: pool.name,
        winners: ws,
        isFirstPrize: pool.isFirstPrize ?? false,
      });
      setStatus("idle");
      setSelectedPool(null);

      // 播放中奖弹窗音效
      bgMusic.playWinModal();

      // 抽奖结束，切换回背景音乐
      bgMusic.playIdle();

      triggerConfetti();
    },
    [triggerConfetti],
  );

  const reveal = useCallback(
    (ws: Participant[], idx: number, pool: PrizePool, drawnItems: string[]) => {
      if (idx >= ws.length) {
        // 所有卡片已递归点亮并播放完飞行动画
        // 递归调用链本身已经累积了足够的等待时间，无需额外延迟
        timer.current = window.setTimeout(
          () => finalize(ws, pool, drawnItems),
          0,
        );
        return;
      }
      // 点亮当前卡片（触发 CSS 飞行动画）
      setWinners((prev) =>
        prev.map((w, i) => (i === idx ? { ...w, revealing: 1 } : w)),
      );
      // 播放卡片亮起音效
      bgMusic.playCardReveal();
      // 等待当前卡片完成整个动画流程后，再开始下一张
      timer.current = window.setTimeout(
        () => reveal(ws, idx + 1, pool, drawnItems),
        LOTTERY_FLOW.CARD_INTERVAL,
      );
    },
    [finalize],
  );

  const start = useCallback(() => {
    if (!selectedPool) return alert("请先选择一个奖池");
    if (status !== "idle") return;
    if (pool.length === 0) return alert("没有可抽取的参与者");

    // 检查奖池是否还有奖品
    const remainingItems = selectedPool.items.slice(selectedPool.drawnCount);
    const actualDrawCount = Math.min(
      drawCount,
      remainingItems.length,
      pool.length,
    );

    if (actualDrawCount <= 0) {
      return alert("该奖池已抽完");
    }

    // 抽取中奖者
    const [drawnRaw] = drawWinners(pool, actualDrawCount);

    // 分配奖品
    const shuffledItems = shuffle(remainingItems.slice(0, actualDrawCount));
    const drawn = drawnRaw.map((person, index) => ({
      ...person,
      specificPrize: shuffledItems[index] || selectedPool.name,
    }));

    setFriction(calculateDynamics(drawn.length));
    setStatus("rolling");

    // 音效已由背景音乐替代

    // 切换到抽奖音乐
    bgMusic.playRolling();

    timer.current = window.setTimeout(() => {
      setWinners(drawn.map((w) => ({ ...w, revealing: 0 })));
      setStatus("revealing");
      reveal(drawn, 0, selectedPool, shuffledItems);
    }, 4500);
  }, [status, selectedPool, drawCount, pool, reveal]);

  const reset = useCallback(() => {
    setResult(null);
    setWinners([]);
    // 关闭弹窗后恢复背景音乐
    bgMusic.playIdle();
  }, []);

  // 获取指定奖池的历史记录
  const getPoolHistory = useCallback(
    (poolId: string) => {
      return history.filter((h) => h.poolId === poolId);
    },
    [history],
  );

  const downloadResults = useCallback(() => {
    // 按奖池分组导出
    const grouped = history.reduce(
      (acc, record) => {
        if (!acc[record.poolName]) {
          acc[record.poolName] = [];
        }
        acc[record.poolName].push(...record.winners);
        return acc;
      },
      {} as Record<string, Participant[]>,
    );

    exportToExcel(grouped);
  }, [history]);

  const clearAllData = useCallback(() => {
    if (
      window.confirm("确定要清空所有抽奖记录并重新开始吗？此操作不可恢复！")
    ) {
      // 停止音乐
      bgMusic.stop();
      setHistory([]);
      setPool([]);
      setPrizePools(PRIZE_POOLS);
      setSelectedPool(null);
      localStorage.removeItem(STORAGE_KEY);
      window.location.reload();
    }
  }, []);

  // 计算当前可选的最大抽取数量
  const maxDrawCount = selectedPool
    ? Math.min(
        selectedPool.items.length - selectedPool.drawnCount,
        pool.length,
        50,
      )
    : 0;

  return {
    pool,
    status,
    winners,
    result,
    friction,

    // 奖池相关
    prizePools,
    selectedPool,
    drawCount,
    maxDrawCount,
    selectPool,
    setDrawQuantity,

    // 历史记录
    history,
    getPoolHistory,

    // 操作
    uploadFile,
    start,
    reset,
    downloadResults,
    clearAllData,

    // 状态
    hasFile: pool.length > 0 || history.length > 0,
    canStart: selectedPool !== null && status === "idle" && maxDrawCount > 0,
  };
};
