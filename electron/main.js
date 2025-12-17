const { app, BrowserWindow } = require("electron");
const path = require("path");

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    titleBarStyle: "hiddenInset", // Macらしい見た目
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // アプリ化された時はビルドファイルを、開発中はローカルサーバーを表示
  if (app.isPackaged) {
    win.loadFile(path.join(__dirname, "../dist/index.html"));
  } else {
    // 開発時は npm run dev のURLを開く（ポート番号が違う場合は変更してください）
    win.loadURL("http://localhost:5173");
  }
}

app.whenReady().then(() => {
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
