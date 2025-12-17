const { app, BrowserWindow } = require("electron");
const path = require("path");

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    titleBarStyle: "hiddenInset",
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // ★ここを追加：開発者ツールを開く
  win.webContents.openDevTools();

  if (app.isPackaged) {
    // 本番ビルド時の読み込み
    // エラーが出たときにパスが合っているか確認しやすいようにコンソールに出力
    console.log(
      "Loading file from:",
      path.join(__dirname, "../dist/index.html")
    );

    win.loadFile(path.join(__dirname, "../dist/index.html")).catch((e) => {
      console.error("Failed to load index.html:", e);
    });
  } else {
    win.loadURL("http://localhost:5173");
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
