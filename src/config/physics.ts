// src/config/physics.ts
// 物理引擎配置 - 统一管理所有与球体旋转相关的参数
// 修改这里的值会自动同步到所有相关代码

/**
 * =========================================
 * 球体旋转物理参数
 * =========================================
 */
export const PHYSICS = {
  /** 空闲时的慢速旋转速度 (度/帧) */
  IDLE_SPEED: 0.3,

  /** 抽奖时的最高速度 (度/帧) */
  MAX_SPEED: 8,

  /** 加速度 (度/帧²) - 从IDLE加速到MAX需要约10帧(0.16秒) */
  ACCELERATION: 0.02,

  /** 空闲时平滑过渡的插值系数 (0-1) */
  IDLE_LERP_FACTOR: 0.1,
} as const;

/**
 * =========================================
 * 减速计算参数
 * =========================================
 */
export const DECELERATION = {
  /** 起始速度 (应与 PHYSICS.MAX_SPEED 一致) */
  START_SPEED: PHYSICS.MAX_SPEED,

  /** 目标结束速度 (必须与 PHYSICS.IDLE_SPEED 一致) */
  END_SPEED: PHYSICS.IDLE_SPEED,

  /** 帧率 (fps) */
  FPS: 60,

  /** 摩擦系数的最小值 (防止减速过快) */
  MIN_FRICTION: 0.9,

  /** 摩擦系数的最大值 (防止减速过慢) */
  MAX_FRICTION: 0.995,
} as const;

/**
 * =========================================
 * 抽奖流程时间参数
 * =========================================
 *
 * 核心设计：减速阶段完全覆盖揭晓阶段
 * - 滚动阶段：加速到最高速
 * - 揭晓阶段：开始减速，同时逐张揭晓卡片
 * - 目标：最后一张卡片揭晓时，球体刚好降到IDLE_SPEED
 *
 * ⚠️ 注意：REVEAL_BASE_DELAY 必须与 CARD_ANIMATION.TOTAL 保持一致
 * 确保前一张卡片飞行动画完成后再开始下一张
 */
export const TIMING = {
  /**
   * 加速阶段持续时间 (ms)
   * 给用户一个"加速中"的视觉感受，然后进入揭晓阶段
   */
  ACCELERATION_DURATION: 5000,

  /**
   * 揭晓卡片的基础间隔 (ms)
   * 必须 >= CARD_ANIMATION.TOTAL (2500ms)，确保动画不重叠
   */
  REVEAL_BASE_DELAY: 2500,

  /**
   * 揭晓卡片间隔的增量区间 (ms)
   * 用于让后面的卡片揭晓间隔逐渐拉长，配合减速
   */
  REVEAL_SPAN: 0,

  /** 最后一张卡片揭晓后到弹窗的缓冲时间 (ms) */
  REVEAL_BUFFER: 500,
} as const;

/**
 * =========================================
 * 球体渲染参数
 * =========================================
 */
export const SPHERE = {
  /** 基础半径 (px) */
  RADIUS_BASE: 180,

  /** 半径增长系数 */
  RADIUS_GROWTH: 15,

  /** 最大显示卡片数 */
  MAX_CARDS: 120,

  /** 3D 透视距离 (px) - 越小透视效果越强 */
  PERSPECTIVE: 1500,
} as const;
