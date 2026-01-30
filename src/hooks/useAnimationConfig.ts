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

    // 计算并设置 CSS 变量
    const totalSeconds = toCssSeconds(CARD_ANIMATION.TOTAL);
    root.style.setProperty("--card-anim-total", totalSeconds);

    // 调试：检查变量是否正确设置
    const computed = getComputedStyle(root).getPropertyValue("--card-anim-total");
    // eslint-disable-next-line no-console
    console.log("[Animation Config] CSS 变量 --card-anim-total:", computed, "(设置值:", totalSeconds, ")");
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
    root.style.setProperty(
      "--lottery-card-interval",
      toCssSeconds(LOTTERY_FLOW.CARD_INTERVAL),
    );
    root.style.setProperty(
      "--lottery-modal-delay",
      toCssSeconds(LOTTERY_FLOW.MODAL_DELAY),
    );
    root.style.setProperty(
      "--lottery-flip-delay",
      toCssSeconds(LOTTERY_FLOW.FLIP_DELAY),
    );
    root.style.setProperty(
      "--lottery-flip-interval",
      `${LOTTERY_FLOW.FLIP_INTERVAL}ms`,
    );

    // 动态注入 keyframes 规则（覆盖 CSS 文件中的静态定义）
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

    // 在控制台输出当前配置（方便调试）
    // eslint-disable-next-line no-console
    console.log("[Animation Config] 动画配置已同步:", {
      total: CARD_ANIMATION.TOTAL,
      flyToCenter: CARD_ANIMATION.FLY_TO_CENTER,
      showInCenter: CARD_ANIMATION.SHOW_IN_CENTER,
      flyToGrid: CARD_ANIMATION.FLY_TO_GRID,
      cardInterval: LOTTERY_FLOW.CARD_INTERVAL,
      keyframes: {
        flyToCenterEnd: `${flyToCenterPercent}%`,
        showInCenterEnd: `${showInCenterPercent}%`,
      },
    });
  }, []);
};

export default useAnimationConfig;
