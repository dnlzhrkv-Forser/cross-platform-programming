const { contextBridge, ipcRenderer } = require("electron");

// Для сторінки відкриваються лише дві дозволені функції
contextBridge.exposeInMainWorld("pharmacyAPI", {
  loadOrders: () => ipcRenderer.invoke("orders:load"),
  saveOrders: (orders) => ipcRenderer.invoke("orders:save", orders),
});
