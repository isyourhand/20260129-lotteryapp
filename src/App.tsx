// src/App.tsx
// 主应用组件 - 新版：支持自由选择奖池和抽取数量

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
        prizePools={g.prizePools}
        selectedPool={g.selectedPool}
        drawCount={g.drawCount}
        maxDrawCount={g.maxDrawCount}
        history={g.history}
        canStart={g.canStart}
        onSelectPool={g.selectPool}
        onSetDrawCount={g.setDrawQuantity}
        onStart={g.start}
        onExport={g.downloadResults}
        onReset={g.clearAllData}
      />

      <LotteryPanel
        pool={g.pool}
        lotteryState={g.status}
        currentWinners={g.winners}
        friction={g.friction}
        isFirstPrize={g.result?.isFirstPrize ?? false}
      />

      <WinnerModal
        isOpen={!!g.result}
        poolName={g.result?.poolName ?? ""}
        winners={g.result?.winners ?? []}
        isFirstPrize={g.result?.isFirstPrize ?? false}
        onClose={g.reset}
      />
    </div>
  );
};

export default App;
