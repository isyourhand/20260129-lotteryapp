// src/types/index.ts

// 对应 Excel 中的每一行数据
export interface Participant {
  id: number | string;
  name: string;
  department: string;
  revealing: 0 | 1;
  specificPrize?: string; // [新增] 具体奖品名称 (针对幸运奖等混合奖项)
}

export interface PrizeConfig {
  level: number;
  name: string;
  count: number;
  items?: string[]; // [新增] 如果该奖项包含不同种类的具体礼品，存放在这里
}

// 抽奖结果
export interface LotteryResult {
  prizeLevel: number;
  winners: Participant[];
}

export type LotteryState = "idle" | "rolling" | "revealing";
