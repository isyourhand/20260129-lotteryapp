// src/config/prizes.ts
// 奖池配置 - 用户可自由选择抽取哪个奖池

import type { PrizePool } from "../types";
import { shuffle } from "../services/lottery";

// 辅助函数：展开礼物列表
const generateItems = (...items: [string, number][]): string[] => {
  return items.flatMap(([name, count]) => Array(count).fill(name));
};

// 幸运奖池（所有奖品放在一个池子里）
const LUCKY_POOL_ITEMS = generateItems(
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

// 奖池列表 - 用户可自由选择
export const PRIZE_POOLS: PrizePool[] = [
  {
    id: "first",
    name: "一等奖",
    items: ["HUAWEI 平板"],
    drawnCount: 0,
    isFirstPrize: true,
  },
  {
    id: "second",
    name: "二等奖",
    items: generateItems(["小米手表", 2]),
    drawnCount: 0,
  },
  {
    id: "third",
    name: "三等奖",
    items: generateItems(["小米手环", 5]),
    drawnCount: 0,
  },
  {
    id: "sunshine",
    name: "阳光普照奖",
    items: generateItems(["一日带薪假", 5]),
    drawnCount: 0,
  },
  {
    id: "redpacket",
    name: "新年红包",
    items: generateItems(["88元现金红包", 5]),
    drawnCount: 0,
  },
  {
    id: "lucky",
    name: "幸运奖",
    items: shuffle([...LUCKY_POOL_ITEMS]), // 打乱顺序
    drawnCount: 0,
  },
];

export const STORAGE_KEY = "LOTTERY_HISTORY_V2";
