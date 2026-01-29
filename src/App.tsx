// src/App.tsx
// 主应用组件

import React from "react";
import { useLotteryGame } from "./hooks/useLottery";
import { LotteryPanel } from "./components/LotteryPanel";
import { WinnerModal } from "./components/WinnerModal";
import { Sidebar } from "./components/Sidebar";
import { UploadLayer } from "./components/UploadLayer";
import "./styles/main.css";

const App: React.FC = () => {
  const g = useLotteryGame();

  // 如果没有文件，显示上传层
  if (!g.hasFile) {
    return (
      <div className="container">
        <UploadLayer onUpload={g.uploadFile} />
      </div>
    );
  }

  return (
    <div className="container">
      <Sidebar
        active={g.activePrize}
        history={g.history}
        onExport={g.downloadResults}
        onReset={g.clearAllData}
      />

      <LotteryPanel
        pool={g.pool}
        lotteryState={g.status}
        currentWinners={g.winners}
        friction={g.friction}
      />

      <div className="control-bar">
        <button
          className="btn-start"
          onClick={g.start}
          disabled={g.status !== "idle" || !!g.result || g.prizeIdx < 0}
        >
          {g.status === "revealing" ? "抽奖中..." : "开始抽奖"}
        </button>
      </div>

      <WinnerModal
        isOpen={!!g.result}
        prizeName={g.result?.prize ?? ""}
        winners={g.result?.winners ?? []}
        onClose={g.reset}
      />
    </div>
  );
};

export default App;
