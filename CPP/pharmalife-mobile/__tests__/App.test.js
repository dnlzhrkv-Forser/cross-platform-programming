import { Alert } from "react-native";
import { render, screen, fireEvent } from "@testing-library/react-native";
import App from "../App";

let alertSpy;
beforeEach(() => {
  alertSpy = jest.spyOn(Alert, "alert").mockImplementation(() => {});
});
afterEach(() => jest.restoreAllMocks());

const fillForm = ({ name = "", phone = "", total = "", address = "" }) => {
  fireEvent.changeText(screen.getByPlaceholderText("Ім’я клієнта"), name);
  fireEvent.changeText(screen.getByPlaceholderText("Телефон, +380…"), phone);
  fireEvent.changeText(screen.getByPlaceholderText("Сума, ₴"), total);
  fireEvent.changeText(screen.getByPlaceholderText("Адреса доставки"), address);
};
const submit = () => fireEvent.press(screen.getByText("Додати замовлення"));
const valid = { name: "Іван", phone: "+380501234567", total: "150,5", address: "Київ, Хрещатик 1" };

describe("Початковий екран", () => {
  test("показує заголовок, нульові лічильники та порожній список", () => {
    render(<App />);
    expect(screen.getByText("ФармаЛайф Mobile")).toBeTruthy();
    expect(screen.getByText("Усього замовлень: 0 · Виконано: 0")).toBeTruthy();
    expect(screen.getByText("На суму: 0.00 ₴")).toBeTruthy();
    expect(screen.getByText("Замовлень поки немає. Додайте перше!")).toBeTruthy();
  });
});

describe("Валідація", () => {
  test("порожнє ім’я", () => {
    render(<App />);
    fillForm({ ...valid, name: "   " });
    submit();
    expect(alertSpy).toHaveBeenCalledWith("Помилка", "Будь ласка, введіть ім’я клієнта.");
    expect(screen.getByText("Замовлень поки немає. Додайте перше!")).toBeTruthy();
  });

  test.each([["123"], ["abcdefghij"], ["+38050123456789012"], [""]])("некоректний телефон «%s»", (phone) => {
    render(<App />);
    fillForm({ ...valid, phone });
    submit();
    expect(alertSpy).toHaveBeenCalledWith("Помилка", "Вкажіть коректний телефон, наприклад +380501234567.");
  });

  test("порожня адреса", () => {
    render(<App />);
    fillForm({ ...valid, address: "  " });
    submit();
    expect(alertSpy).toHaveBeenCalledWith("Помилка", "Вкажіть адресу доставки.");
  });

  test.each([["0"], ["-5"], ["abc"], [""]])("некоректна сума «%s»", (total) => {
    render(<App />);
    fillForm({ ...valid, total });
    submit();
    expect(alertSpy).toHaveBeenCalledWith("Помилка", "Сума має бути числом більшим за нуль.");
  });

  test("при помилці поля форми не очищуються", () => {
    render(<App />);
    fillForm({ ...valid, total: "0" });
    submit();
    expect(screen.getByPlaceholderText("Ім’я клієнта").props.value).toBe("Іван");
  });
});

describe("Додавання замовлення", () => {
  test("додає запис, оновлює лічильники, очищає форму, показує успіх", () => {
    render(<App />);
    fillForm(valid);
    submit();

    expect(alertSpy).toHaveBeenCalledWith("Успіх", "Замовлення успішно додано.");
    expect(screen.getByText(/Іван/)).toBeTruthy();
    expect(screen.getByText("Сума: 150.50 ₴")).toBeTruthy();
    expect(screen.getByText("Усього замовлень: 1 · Виконано: 0")).toBeTruthy();
    expect(screen.getByText("На суму: 150.50 ₴")).toBeTruthy();
    expect(screen.queryByText("Замовлень поки немає. Додайте перше!")).toBeNull();
    expect(screen.getByPlaceholderText("Ім’я клієнта").props.value).toBe("");
    expect(screen.getByPlaceholderText("Сума, ₴").props.value).toBe("");
  });

  test("значення полів обрізаються від пробілів", () => {
    render(<App />);
    fillForm({ name: "  Олена  ", phone: " +380671112233 ", total: " 10 ", address: "  Львів  " });
    submit();
    expect(screen.getByText(/№\d{6} · Олена$/)).toBeTruthy();
    expect(screen.getByText("+380671112233 · Львів")).toBeTruthy();
  });

  test("нове замовлення з’являється на початку списку", () => {
    const now = jest.spyOn(Date, "now");
    render(<App />);

    now.mockReturnValue(1700000000001);
    fillForm({ ...valid, name: "Перший" });
    submit();
    now.mockReturnValue(1700000000002);
    fillForm({ ...valid, name: "Другий" });
    submit();

    const titles = screen.getAllByText(/№\d{6} ·/).map((n) => n.props.children.join(""));
    expect(titles[0]).toContain("Другий");
    expect(titles[1]).toContain("Перший");
    expect(screen.getByText("Усього замовлень: 2 · Виконано: 0")).toBeTruthy();
  });

  test("номер замовлення — останні 6 цифр id", () => {
    jest.spyOn(Date, "now").mockReturnValue(1700000123456);
    render(<App />);
    fillForm(valid);
    submit();
    expect(screen.getByText("№123456 · Іван")).toBeTruthy();
  });

  test("відправка з клавіатури (Done в полі адреси) теж додає замовлення", () => {
    render(<App />);
    fillForm(valid);
    fireEvent(screen.getByPlaceholderText("Адреса доставки"), "submitEditing");
    expect(alertSpy).toHaveBeenCalledWith("Успіх", "Замовлення успішно додано.");
  });
});

describe("Виконання та видалення", () => {
  const addTwo = () => {
    const now = jest.spyOn(Date, "now");
    now.mockReturnValue(1700000000001);
    fillForm({ ...valid, name: "Перший", total: "100" });
    submit();
    now.mockReturnValue(1700000000002);
    fillForm({ ...valid, name: "Другий", total: "50" });
    submit();
    alertSpy.mockClear();
  };

  test("торкання позначає виконаним і повертає назад", () => {
    render(<App />);
    addTwo();

    fireEvent.press(screen.getByText("№000001 · Перший"));
    expect(screen.getByText("Усього замовлень: 2 · Виконано: 1")).toBeTruthy();

    fireEvent.press(screen.getByText("№000001 · Перший"));
    expect(screen.getByText("Усього замовлень: 2 · Виконано: 0")).toBeTruthy();
  });

  test("видалення прибирає лише вибране замовлення і перераховує суму", () => {
    render(<App />);
    addTwo();

    fireEvent.press(screen.getAllByText("Видалити")[0]); // «Другий» — зверху
    expect(alertSpy).toHaveBeenCalledWith("Видалення", "Замовлення видалено.");
    expect(screen.queryByText("№000002 · Другий")).toBeNull();
    expect(screen.getByText("№000001 · Перший")).toBeTruthy();
    expect(screen.getByText("Усього замовлень: 1 · Виконано: 0")).toBeTruthy();
    expect(screen.getByText("На суму: 100.00 ₴")).toBeTruthy();
  });

  test("після видалення всіх знову показується порожній стан", () => {
    render(<App />);
    fillForm(valid);
    submit();
    fireEvent.press(screen.getByText("Видалити"));
    expect(screen.getByText("Замовлень поки немає. Додайте перше!")).toBeTruthy();
    expect(screen.getByText("На суму: 0.00 ₴")).toBeTruthy();
  });
});
