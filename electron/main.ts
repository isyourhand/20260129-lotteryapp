import { app, BrowserWindow } from "electron";
import path from "path";
import { fileURLToPath } from "url"; // 1. 引入这个工具

// 2. 手动定义 __dirname 和 __filename
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// process.env.VITE_DEV_SERVER_URL 是 vite-plugin-electron 自动注入的变量
// 如果你没用那个插件，就需要手动判断
const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL;

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      // 3. 这里现在可以使用 __dirname 了
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false, // 推荐安全设置
      contextIsolation: true, // 推荐安全设置
    },
  });

  // 4. 智能加载：开发环境加载 URL，打包环境加载文件
  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
  } else {
    // 假如你只是手动启动 npm run dev，没有注入变量，可以用这个备用方案：
    // win.loadURL("http://localhost:5173"); // Vite 默认通常是 5173 不是 3000
    
    // 生产环境（打包后）
    win.loadFile(path.join(__dirname, "../dist/index.html"));
  }
}

app.whenReady().then(createWindow);

// 窗口全部关闭时退出 (macOS 除外)
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});