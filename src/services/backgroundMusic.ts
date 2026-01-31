// src/services/backgroundMusic.ts
// 背景音乐管理 - 支持背景音乐(循环)和抽奖音乐(循环)

// 音频文件路径
const IDLE_MUSIC_PATH = "/music/1.mp3"; // 背景音乐 - 未抽奖时播放
const ROLLING_MUSIC_PATH = "/music/6.mp3"; // 抽奖音乐 - 抽奖时播放
const CARD_REVEAL_PATH = "/music/3.mp3"; // 卡片亮起音效
// const WIN_MODAL_PATH = "/music/5.wav"; // 中奖弹窗音效

type MusicMode = "idle" | "rolling";

class BackgroundMusic {
  private idleAudio: HTMLAudioElement | null = null;
  private rollingAudio: HTMLAudioElement | null = null;
  private cardRevealAudio: HTMLAudioElement | null = null;
  private winModalAudio: HTMLAudioElement | null = null;
  private currentMode: MusicMode | null = null;
  private hasUserInteracted = false;
  private pendingMode: MusicMode | null = null;
  private isMuted = false;

  constructor() {
    // 监听用户首次交互，之后才能播放音频
    const handleUserInteraction = () => {
      this.hasUserInteracted = true;
      if (this.pendingMode) {
        const mode = this.pendingMode;
        this.pendingMode = null;
        this.play(mode);
      }
      // 移除监听器
      document.removeEventListener("click", handleUserInteraction);
      document.removeEventListener("touchstart", handleUserInteraction);
      document.removeEventListener("keydown", handleUserInteraction);
    };

    document.addEventListener("click", handleUserInteraction, { once: true });
    document.addEventListener("touchstart", handleUserInteraction, {
      once: true,
    });
    document.addEventListener("keydown", handleUserInteraction, { once: true });
  }

  /**
   * 加载音频
   */
  private loadIdle(): void {
    if (!this.idleAudio) {
      this.idleAudio = new Audio(IDLE_MUSIC_PATH);
      this.idleAudio.loop = true;
      this.idleAudio.volume = 0.7;

      this.idleAudio.addEventListener("error", (e) => {
        console.error("[BGM] 背景音乐加载失败:", e);
      });
    }
  }

  private loadRolling(): void {
    if (!this.rollingAudio) {
      this.rollingAudio = new Audio(ROLLING_MUSIC_PATH);
      this.rollingAudio.loop = true;
      this.rollingAudio.volume = 0.8;

      this.rollingAudio.addEventListener("error", (e) => {
        console.error("[BGM] 抽奖音乐加载失败:", e);
      });
    }
  }

  /**
   * 停止所有音乐
   */
  private stopAll(): void {
    if (this.idleAudio) {
      this.idleAudio.pause();
      this.idleAudio.currentTime = 0;
    }
    if (this.rollingAudio) {
      this.rollingAudio.pause();
      this.rollingAudio.currentTime = 0;
    }
    this.currentMode = null;
  }

  /**
   * 播放指定模式的音乐
   */
  play(mode: MusicMode): void {
    // 如果用户还没交互过，先标记为待播放
    if (!this.hasUserInteracted) {
      console.log(`[BGM] 等待用户交互后才能播放 ${mode} 音乐...`);
      this.pendingMode = mode;
      return;
    }

    // 如果已经在播放该模式，不重复操作
    if (this.currentMode === mode) {
      return;
    }

    // 先停止当前音乐
    this.stopAll();

    // 加载并播放对应音乐
    if (mode === "idle") {
      this.loadIdle();
      if (this.idleAudio) {
        this.idleAudio
          .play()
          .then(() => {
            this.currentMode = "idle";
            console.log("[BGM] 背景音乐开始播放 (1.mp3)");
          })
          .catch((err) => {
            console.error("[BGM] 背景音乐播放失败:", err);
          });
      }
    } else {
      this.loadRolling();
      if (this.rollingAudio) {
        this.rollingAudio
          .play()
          .then(() => {
            this.currentMode = "rolling";
            console.log("[BGM] 抽奖音乐开始播放 (2.wav)");
          })
          .catch((err) => {
            console.error("[BGM] 抽奖音乐播放失败:", err);
          });
      }
    }
  }

  /**
   * 播放背景音乐（未抽奖时）
   */
  playIdle(): void {
    this.play("idle");
  }

  /**
   * 播放抽奖音乐
   */
  playRolling(): void {
    this.play("rolling");
  }

  /**
   * 停止所有音乐
   */
  stop(): void {
    this.stopAll();
    this.pendingMode = null;
    console.log("[BGM] 音乐已停止");
  }

  /**
   * 设置音量
   */
  setVolume(volume: number): void {
    const v = Math.max(0, Math.min(1, volume));
    if (this.idleAudio) {
      this.idleAudio.volume = v;
    }
    if (this.rollingAudio) {
      this.rollingAudio.volume = v;
    }
  }

  /**
   * 设置静音
   */
  setMuted(muted: boolean): void {
    this.isMuted = muted;
    if (this.idleAudio) {
      this.idleAudio.muted = muted;
    }
    if (this.rollingAudio) {
      this.rollingAudio.muted = muted;
    }
    if (this.cardRevealAudio) {
      this.cardRevealAudio.muted = muted;
    }
    if (this.winModalAudio) {
      this.winModalAudio.muted = muted;
    }
  }

  /**
   * 播放卡片亮起音效 (3.mp3)
   */
  playCardReveal(): void {
    if (this.isMuted || !this.hasUserInteracted) {
      return;
    }

    if (!this.cardRevealAudio) {
      this.cardRevealAudio = new Audio(CARD_REVEAL_PATH);
      this.cardRevealAudio.volume = 0.6;
      this.cardRevealAudio.muted = this.isMuted;

      this.cardRevealAudio.addEventListener("error", (e) => {
        console.error("[BGM] 卡片亮起音效加载失败:", e);
      });
    }

    // 重置并播放
    this.cardRevealAudio.currentTime = 0;
    this.cardRevealAudio.play().catch((err) => {
      console.error("[BGM] 卡片亮起音效播放失败:", err);
    });
  }

  /**
   * 播放中奖弹窗音效 (4.wav)
   */
  playWinModal(): void {
    // 音效路径已注释掉，此功能禁用
    return;
  }

  /**
   * 获取当前播放模式
   */
  getCurrentMode(): MusicMode | null {
    return this.currentMode;
  }

  /**
   * 获取播放状态
   */
  getIsPlaying(): boolean {
    return this.currentMode !== null;
  }
}

// 单例导出
export const bgMusic = new BackgroundMusic();
export default bgMusic;
