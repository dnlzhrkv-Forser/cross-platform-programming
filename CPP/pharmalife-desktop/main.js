const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const fs = require("fs");

// Шлях до файлу orders.json у теці даних застосунку (userData)
function getOrdersFilePath() {
  return path.join(app.getPath("userData"), "orders.json");
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1000,
    height: 760,
    title: "ФармаЛайф Desktop",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  win.loadFile(path.join(__dirname, "renderer", "index.html"));
}

// IPC: завантаження списку замовлень із файлу
ipcMain.handle("orders:load", () => {
  const filePath = getOrdersFilePath();

  if (!fs.existsSync(filePath)) {
    return [];
  }

  try {
    const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("Не вдалося прочитати файл:", error.message);
    return [];
  }
});

// IPC: збереження списку замовлень у файл
ipcMain.handle("orders:save", (event, orders) => {
  fs.writeFileSync(getOrdersFilePath(), JSON.stringify(orders, null, 2), "utf-8");
  return true;
});

app.whenReady().then(() => {
  createWindow();

  // macOS: створити вікно, якщо клікнули на іконку в Dock, а вікон немає
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Windows і Linux: завершити застосунок після закриття всіх вікон
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
