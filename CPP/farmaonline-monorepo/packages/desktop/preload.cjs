const { contextBridge, ipcRenderer } = require("electron");

// Preload має бути файлом CommonJS (.cjs). Сторінці відкриті лише ці функції.
contextBridge.exposeInMainWorld("pharmacyAPI", {
  list: (query) => ipcRenderer.invoke("medicines:list", query),
  summary: (query) => ipcRenderer.invoke("medicines:summary", query),
  add: (payload) => ipcRenderer.invoke("medicines:add", payload),
  remove: (id) => ipcRenderer.invoke("medicines:remove", id),
});
