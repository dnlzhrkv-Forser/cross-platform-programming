import { formatMedicineDate } from "@farmaonline/core";

export const ERROR_INVALID_DATA = "Некоректні дані.";

const isTextOrNumber = (value) => typeof value === "string" || typeof value === "number";

function withDateLabel(medicine) {
  return { ...medicine, dateLabel: formatMedicineDate(medicine.createdAt) };
}

// Обробники IPC над спільним сервісом. Перевіряють тип даних із рендер-процесу
// і додають до препаратів поле dateLabel — дату для показу. Модуль не залежить від Electron.
export function createHandlers(service) {
  return {
    async list(query) {
      const medicines = await service.list(typeof query === "string" ? query : "");
      return medicines.map(withDateLabel);
    },

    async summary(query) {
      return service.summary(typeof query === "string" ? query : "");
    },

    async add(payload) {
      if (
        payload === null ||
        typeof payload !== "object" ||
        typeof payload.name !== "string" ||
        !isTextOrNumber(payload.price) ||
        !isTextOrNumber(payload.quantity)
      ) {
        return { ok: false, error: ERROR_INVALID_DATA };
      }
      const result = await service.add({
        name: payload.name,
        price: payload.price,
        quantity: payload.quantity,
      });
      return result.ok ? { ok: true, medicine: withDateLabel(result.medicine) } : result;
    },

    async remove(id) {
      const numericId = typeof id === "string" && id.trim() !== "" ? Number(id) : id;
      if (typeof numericId !== "number" || !Number.isFinite(numericId)) {
        return { ok: false, error: ERROR_INVALID_DATA };
      }
      return service.remove(numericId);
    },
  };
}
