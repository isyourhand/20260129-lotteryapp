// src/config/animation.ts
// 动画时间配置 - 修改这里的值会自动同步到所有相关代码
// 注意：修改后需要重新构建项目

/**
 * 中奖卡片飞行动画配置
 * 三阶段动画：球体 -> 屏幕中央展示 -> 右侧网格
 */
export const CARD_ANIMATION = {
  /** 飞到屏幕中央的时间（毫秒） */
  FLY_TO_CENTER: 500,

  /** 在屏幕中央展示的时间（毫秒） */
  SHOW_IN_CENTER: 1000,

  /** 从中央飞到右侧网格的时间（毫秒） */
  FLY_TO_GRID: 500,

  /** 总动画时长（自动计算） */
  get TOTAL() {
    return this.FLY_TO_CENTER + this.SHOW_IN_CENTER + this.FLY_TO_GRID;
  },
} as const;

/**
 * 抽奖流程控制配置
 */
export const LOTTERY_FLOW = {
  /**
   * 每张卡片动画之间的额外间隔（毫秒）
   * 控制前一张动画完成后，等待多久才开始下一张
   * 设为 0 表示前一张飞到右边后立即开始下一张（无额外等待）
   */
  EXTRA_DELAY: 0,

  /**
   * 每张卡片动画之间的间隔（自动计算）
   * = 动画总时长 + 额外间隔
   */
  get CARD_INTERVAL() {
    return CARD_ANIMATION.TOTAL + this.EXTRA_DELAY;
  },

  /** 所有卡片到位后，弹窗出现的延迟（毫秒） */
  MODAL_DELAY: 500,

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
