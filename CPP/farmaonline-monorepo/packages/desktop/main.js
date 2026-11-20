import { app, BrowserWindow, ipcMain } from "electron";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { MedicinesService } from "@farmaonline/core";
import { FileStorageAdapter } from "./fileStorageAdapter.js";
import { createHandlers } from "./ipcHandlers.js";

// У модулі ES немає __dirname: теку файлу беремо з import.meta.url
const __dirname = path.dirname(fileURLToPath(import.meta.url));

function createWindow() {
  const win = new BrowserWindow({
    width: 900,
    height: 700,
    title: "ФармаОнлайн Desktop",
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  win.loadFile(path.join(__dirname, "renderer", "index.html"));
}

app.whenReady().then(() => {
  const adapter = new FileStorageAdapter(path.join(app.getPath("userData"), "medicines.json"));
  const handlers = createHandlers(new MedicinesService(adapter));

  ipcMain.handle("medicines:list", (event, query) => handlers.list(query));
  ipcMain.handle("medicines:summary", (event, query) => handlers.summary(query));
  ipcMain.handle("medicines:add", (event, payload) => handlers.add(payload));
  ipcMain.handle("medicines:remove", (event, id) => handlers.remove(id));

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
