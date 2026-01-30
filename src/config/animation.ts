// src/config/animation.ts
// 动画时间配置 - 修改这里的值会自动同步到所有相关代码
// ⚠️ 注意：修改后需要重新构建项目

/**
 * =========================================
 * 中奖卡片飞行动画配置 - 三阶段动画
 * =========================================
 * 动画流程：球体位置 -> 屏幕中央展示 -> 右侧网格
 *
 * 第1阶段：卡片从球体飞到屏幕中央
 * 第2阶段：卡片在屏幕中央展示
 * 第3阶段：卡片从中央飞到右侧网格排列
 */
export const CARD_ANIMATION = {
  /** 第1阶段：飞到屏幕中央的时间（毫秒） */
  FLY_TO_CENTER: 500,

  /** 第2阶段：在屏幕中央展示的时间（毫秒） */
  SHOW_IN_CENTER: 1000,

  /** 第3阶段：从中央飞到右侧网格的时间（毫秒） */
  FLY_TO_GRID: 1000,

  /** 单张卡片动画总时长（自动计算） */
  get TOTAL() {
    return this.FLY_TO_CENTER + this.SHOW_IN_CENTER + this.FLY_TO_GRID;
  },

  /** 将毫秒转换为秒（用于CSS） */
  get totalSeconds() {
    return this.TOTAL / 1000;
  },
} as const;

/**
 * =========================================
 * 抽奖流程控制配置
 * =========================================
 */
export const LOTTERY_FLOW = {
  /**
   * 每张卡片动画之间的间隔（毫秒）
   * 串行动画：前一张完全到位后，下一张才开始
   * = 单张卡片总时长
   */
  get CARD_INTERVAL() {
    return CARD_ANIMATION.TOTAL;
  },

  /**
   * 计算弹窗出现延迟（毫秒）
   * @param winnerCount 中奖人数
   * @returns 弹窗应该延迟多少毫秒后弹出
   *
   * 弹窗在所有卡片飞行动画完成后才弹出：
   * - 第1张卡片：0ms 开始，TOTAL ms 结束
   * - 第2张卡片：INTERVAL ms 开始，INTERVAL + TOTAL ms 结束
   * - ...
   * - 第N张卡片：(N-1)*INTERVAL ms 开始，(N-1)*INTERVAL + TOTAL ms 结束
   *
   * 最后一张卡片结束时间 = (N-1)*INTERVAL + TOTAL
   * 由于 INTERVAL = TOTAL，所以最后一张结束时间 = N * TOTAL
   */
  getModalDelay: (winnerCount: number) => {
    if (winnerCount <= 0) return 0;
    console.log(CARD_ANIMATION);
    return winnerCount * CARD_ANIMATION.TOTAL;
  },

  /** 弹窗出现后，问号卡片开始翻转的延迟（毫秒） */
  FLIP_DELAY: 300,

  /** 弹窗内每张卡片翻转的间隔（毫秒） */
  FLIP_INTERVAL: 120,
} as const;

/**
 * 将毫秒转换为 CSS 秒数（用于样式计算）
 */
export const toCssSeconds = (ms: number): string => `${ms / 1000}s`;

/**
 * 将毫秒转换为 CSS 百分比（用于 keyframes）
 * @param ms 时间点（毫秒）
 * @param total 总时长（毫秒）
 */
export const toCssPercent = (ms: number, total: number): string =>
  `${((ms / total) * 100).toFixed(1)}%`;

/**
 * 获取 CSS keyframes 百分比节点
 * 用于 flyFromSphereToGrid 动画
 */
export const getKeyframes = () => {
  const total = CARD_ANIMATION.TOTAL;
  const centerEnd = CARD_ANIMATION.FLY_TO_CENTER;
  const showEnd = centerEnd + CARD_ANIMATION.SHOW_IN_CENTER;

  return {
    FLY_TO_CENTER_END: toCssPercent(centerEnd, total),
    SHOW_IN_CENTER_END: toCssPercent(showEnd, total),
    TOTAL: toCssPercent(total, total),
  };
};

// 导出计算后的配置（用于调试）
export const DEBUG_CONFIG = {
  ...CARD_ANIMATION,
  ...LOTTERY_FLOW,
  KEYFRAMES: getKeyframes(),
};
