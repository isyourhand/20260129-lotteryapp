// src/config/prizes.ts
// 奖项配置

import type { PrizeConfig } from "../types";
import { shuffle } from "../services/lottery";

// 辅助函数：展开礼物列表
// 输入: generateItems(["玩偶", 2], ["水杯", 1]) -> ["玩偶", "玩偶", "水杯"]
const generateItems = (...items: [string, number][]): string[] => {
  return items.flatMap(([name, count]) => Array(count).fill(name));
};

// 幸运奖池
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

// 预先洗牌，保证两轮奖品的随机性
const SHUFFLED_LUCKY_POOL = shuffle(RAW_LUCKY_POOL);

// 切分奖池
const LUCKY_ROUND_1 = SHUFFLED_LUCKY_POOL.slice(0, 13); // 前13个
const LUCKY_ROUND_2 = SHUFFLED_LUCKY_POOL.slice(13); // 剩下的(10个)

// 奖项列表
export const PRIZES: PrizeConfig[] = [
  {
    level: 1,
    name: "一等奖",
    count: 1,
    items: ["HUAWEI 平板"],
  },
  {
    level: 2,
    name: "二等奖",
    count: 2,
    items: generateItems(["小米手表", 2]),
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

export const STORAGE_KEY = "LOTTERY_HISTORY_V1";
