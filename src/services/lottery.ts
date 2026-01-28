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