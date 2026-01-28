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
