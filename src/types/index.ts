// src/types/index.ts

// 对应 Excel 中的每一行数据
export interface Participant {
  id: number | string;
  name: string;
  department: string;
  revealing: 0 | 1;
  specificPrize?: string; // 具体奖品名称 (针对幸运奖等混合奖项)
}

// 奖池配置
export interface PrizePool {
  id: string;
  name: string;
  items: string[]; // 奖品列表
  drawnCount: number; // 已抽取数量
  isFirstPrize?: boolean; // 是否为一等奖
}

// 抽奖结果
export interface LotteryResult {
  poolId: string;
  poolName: string;
  winners: Participant[];
}

export type LotteryState = "idle" | "rolling" | "revealing";
