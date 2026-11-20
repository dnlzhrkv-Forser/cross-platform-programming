/** Тест preload.js: у сторінку відкриваються рівно дві дозволені функції. */
describe("preload.js", () => {
  test("expose pharmacyAPI з loadOrders і saveOrders, що йдуть через ipcRenderer.invoke", () => {
    jest.resetModules();
    const exposed = {};
    const invoke = jest.fn().mockResolvedValue("ok");
    jest.doMock(
      "electron",
      () => ({
        contextBridge: { exposeInMainWorld: (name, api) => (exposed[name] = api) },
        ipcRenderer: { invoke },
      }),
      { virtual: true }
    );
    require("../preload.js");

    expect(Object.keys(exposed)).toEqual(["pharmacyAPI"]);
    expect(Object.keys(exposed.pharmacyAPI).sort()).toEqual(["loadOrders", "saveOrders"]);

    exposed.pharmacyAPI.loadOrders();
    expect(invoke).toHaveBeenCalledWith("orders:load");
    const orders = [{ id: 1 }];
    exposed.pharmacyAPI.saveOrders(orders);
    expect(invoke).toHaveBeenCalledWith("orders:save", orders);
  });
});
