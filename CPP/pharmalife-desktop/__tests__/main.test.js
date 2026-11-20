/**
 * Тести main.js (головний процес Electron): IPC-обробники orders:load / orders:save.
 * Модуль electron підміняється моком, файлова система — тимчасовою текою.
 */
const fs = require("fs");
const os = require("os");
const path = require("path");

let tmpDir;
let handlers;
let appHandlers;
let mockBrowserWindow;
let mockApp;

function loadMain() {
  jest.resetModules();
  handlers = {};
  appHandlers = {};
  mockBrowserWindow = jest.fn(function () {
    this.loadFile = jest.fn();
  });
  mockBrowserWindow.getAllWindows = jest.fn(() => []);
  mockApp = {
    getPath: jest.fn(() => tmpDir),
    whenReady: jest.fn(() => Promise.resolve()),
    on: jest.fn((event, cb) => {
      appHandlers[event] = cb;
    }),
    quit: jest.fn(),
  };
  jest.doMock(
    "electron",
    () => ({
      app: mockApp,
      BrowserWindow: mockBrowserWindow,
      ipcMain: { handle: (channel, fn) => (handlers[channel] = fn) },
    }),
    { virtual: true }
  );
  require("../main.js");
}

const ordersFile = () => path.join(tmpDir, "orders.json");
const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "pharmalife-"));
  jest.spyOn(console, "error").mockImplementation(() => {});
  loadMain();
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
  jest.restoreAllMocks();
});

describe("IPC orders:load", () => {
  test("реєструє обидва канали", () => {
    expect(Object.keys(handlers).sort()).toEqual(["orders:load", "orders:save"]);
  });

  test("повертає [] якщо файлу ще немає", () => {
    expect(handlers["orders:load"]()).toEqual([]);
  });

  test("читає збережені замовлення", () => {
    const data = [{ id: 1, name: "Іван" }];
    fs.writeFileSync(ordersFile(), JSON.stringify(data), "utf-8");
    expect(handlers["orders:load"]()).toEqual(data);
  });

  test("пошкоджений JSON → [] і помилка в консолі, без падіння", () => {
    fs.writeFileSync(ordersFile(), "{не json", "utf-8");
    expect(handlers["orders:load"]()).toEqual([]);
    expect(console.error).toHaveBeenCalled();
  });

  test("валідний JSON, але не масив → []", () => {
    fs.writeFileSync(ordersFile(), JSON.stringify({ a: 1 }), "utf-8");
    expect(handlers["orders:load"]()).toEqual([]);
  });
});

describe("IPC orders:save", () => {
  test("записує JSON у userData/orders.json і повертає true", () => {
    const data = [{ id: 1, name: "Олена", total: 10 }];
    expect(handlers["orders:save"]({}, data)).toBe(true);
    expect(JSON.parse(fs.readFileSync(ordersFile(), "utf-8"))).toEqual(data);
    expect(mockApp.getPath).toHaveBeenCalledWith("userData");
  });

  test("збереження + завантаження — круговий обмін без втрат (кирилиця)", () => {
    const data = [{ id: 5, name: "Жарков Данило", address: "м. Київ, вул. Шевченка, 1", total: 99.99 }];
    handlers["orders:save"]({}, data);
    expect(handlers["orders:load"]()).toEqual(data);
  });

  test("порожній список перезаписує старі дані", () => {
    handlers["orders:save"]({}, [{ id: 1 }]);
    handlers["orders:save"]({}, []);
    expect(handlers["orders:load"]()).toEqual([]);
  });
});

describe("Вікно та життєвий цикл", () => {
  test("після app.whenReady створюється вікно з безпечними налаштуваннями", async () => {
    await flush();
    expect(mockBrowserWindow).toHaveBeenCalledTimes(1);
    const opts = mockBrowserWindow.mock.calls[0][0];
    expect(opts.webPreferences.contextIsolation).toBe(true);
    expect(opts.webPreferences.nodeIntegration).toBe(false);
    expect(opts.webPreferences.preload).toMatch(/preload\.js$/);
  });

  test("window-all-closed завершує застосунок на Windows/Linux", () => {
    const original = Object.getOwnPropertyDescriptor(process, "platform");
    Object.defineProperty(process, "platform", { value: "win32" });
    appHandlers["window-all-closed"]();
    expect(mockApp.quit).toHaveBeenCalled();
    Object.defineProperty(process, "platform", original);
  });

  test("window-all-closed НЕ завершує застосунок на macOS", () => {
    const original = Object.getOwnPropertyDescriptor(process, "platform");
    Object.defineProperty(process, "platform", { value: "darwin" });
    appHandlers["window-all-closed"]();
    expect(mockApp.quit).not.toHaveBeenCalled();
    Object.defineProperty(process, "platform", original);
  });

  test("activate створює вікно, якщо жодного немає", async () => {
    await flush();
    mockBrowserWindow.mockClear();
    appHandlers["activate"]();
    expect(mockBrowserWindow).toHaveBeenCalledTimes(1);
  });
});
