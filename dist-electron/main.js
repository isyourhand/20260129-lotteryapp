import { app as e, BrowserWindow as r } from "electron";
import o from "path";
import { fileURLToPath as l } from "url";
const d = l(import.meta.url), t = o.dirname(d), i = process.env.VITE_DEV_SERVER_URL;
function a() {
  const n = new r({
    width: 1200,
    height: 800,
    webPreferences: {
      // 3. 这里现在可以使用 __dirname 了
      preload: o.join(t, "preload.js"),
      nodeIntegration: !1,
      // 推荐安全设置
      contextIsolation: !0
      // 推荐安全设置
    }
  });
  i ? n.loadURL(i) : n.loadFile(o.join(t, "../dist/index.html"));
}
e.whenReady().then(a);
e.on("window-all-closed", () => {
  process.platform !== "darwin" && e.quit();
});
e.on("activate", () => {
  r.getAllWindows().length === 0 && a();
});
