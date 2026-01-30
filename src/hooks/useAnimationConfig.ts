// src/hooks/useAnimationConfig.ts
// 将动画配置同步到 CSS 变量，确保 JS 和 CSS 使用相同的值

import { useEffect } from "react";
import {
  CARD_ANIMATION,
  LOTTERY_FLOW,
  toCssSeconds,
  getKeyframes,
} from "../config/animation";

export const useAnimationConfig = () => {
  useEffect(() => {
    const root = document.documentElement;

    // =========================================
    // 设置 CSS 变量 - 所有动画时间配置
    // =========================================
    
    // 三阶段动画时间
    root.style.setProperty(
      "--card-anim-fly-to-center",
      toCssSeconds(CARD_ANIMATION.FLY_TO_CENTER),
    );
    root.style.setProperty(
      "--card-anim-show-in-center",
      toCssSeconds(CARD_ANIMATION.SHOW_IN_CENTER),
    );
    root.style.setProperty(
      "--card-anim-fly-to-grid",
      toCssSeconds(CARD_ANIMATION.FLY_TO_GRID),
    );
    
    // 单张卡片总时长（CSS动画用这个）
    root.style.setProperty(
      "--card-anim-total",
      toCssSeconds(CARD_ANIMATION.TOTAL),
    );
    
    // 卡片间隔（串行揭晓用）
    root.style.setProperty(
      "--lottery-card-interval",
      toCssSeconds(LOTTERY_FLOW.CARD_INTERVAL),
    );
    
    // 弹窗内翻转动画延迟
    root.style.setProperty(
      "--lottery-flip-delay",
      toCssSeconds(LOTTERY_FLOW.FLIP_DELAY),
    );
    root.style.setProperty(
      "--lottery-flip-interval",
      `${LOTTERY_FLOW.FLIP_INTERVAL}ms`,
    );

    // =========================================
    // 动态注入 keyframes 规则
    // =========================================
    const keyframes = getKeyframes();
    const styleId = "dynamic-animation-keyframes";
    let styleEl = document.getElementById(styleId) as HTMLStyleElement | null;

    if (!styleEl) {
      styleEl = document.createElement("style");
      styleEl.id = styleId;
      document.head.appendChild(styleEl);
    }

    // 计算百分比节点
    const flyToCenterPercent = parseFloat(keyframes.FLY_TO_CENTER_END);
    const showInCenterPercent = parseFloat(keyframes.SHOW_IN_CENTER_END);

    styleEl.textContent = `
      @keyframes flyFromSphereToGrid {
        0% {
          transform: translate(var(--start-offset-x, 0px), var(--start-offset-y, 0px))
            scale(var(--start-scale, 1));
          opacity: 0;
        }
        10% {
          opacity: 1;
        }
        ${flyToCenterPercent}% {
          transform: translate(var(--center-offset-x, 0px), var(--center-offset-y, 0px))
            scale(1.5);
          opacity: 1;
        }
        ${showInCenterPercent}% {
          transform: translate(var(--center-offset-x, 0px), var(--center-offset-y, 0px))
            scale(1.5);
          opacity: 1;
        }
        100% {
          transform: translate(0, 0) scale(1);
          opacity: 1;
        }
      }
    `;

    // =========================================
    // 调试输出
    // =========================================
    console.log("[Animation Config] 动画配置已同步:", {
      // 三阶段时间
      flyToCenter: `${CARD_ANIMATION.FLY_TO_CENTER}ms`,
      showInCenter: `${CARD_ANIMATION.SHOW_IN_CENTER}ms`,
      flyToGrid: `${CARD_ANIMATION.FLY_TO_GRID}ms`,
      // 总时长
      singleCardTotal: `${CARD_ANIMATION.TOTAL}ms`,
      cardInterval: `${LOTTERY_FLOW.CARD_INTERVAL}ms`,
      // keyframes
      keyframes: {
        flyToCenterEnd: `${flyToCenterPercent}%`,
        showInCenterEnd: `${showInCenterPercent}%`,
      },
    });
  }, []);
};

export default useAnimationConfig;
