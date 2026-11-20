import { render, screen, fireEvent } from "@testing-library/react-native";
import Header from "../components/Header";
import OrderItem from "../components/OrderItem";
import OrderList from "../components/OrderList";
import OrderForm from "../components/OrderForm";

const order = { id: "1700000123456", name: "Іван", phone: "+380501234567", address: "Київ", total: 99.9, done: false };

describe("Header", () => {
  test("показує лічильники та суму з двома знаками", () => {
    render(<Header total={3} done={1} sum={12.5} />);
    expect(screen.getByText("Усього замовлень: 3 · Виконано: 1")).toBeTruthy();
    expect(screen.getByText("На суму: 12.50 ₴")).toBeTruthy();
  });
});

describe("OrderItem", () => {
  test("відображає номер, контакти і суму", () => {
    render(<OrderItem order={order} onToggle={() => {}} onDelete={() => {}} />);
    expect(screen.getByText("№123456 · Іван")).toBeTruthy();
    expect(screen.getByText("+380501234567 · Київ")).toBeTruthy();
    expect(screen.getByText("Сума: 99.90 ₴")).toBeTruthy();
  });

  test("onToggle і onDelete викликаються з id", () => {
    const onToggle = jest.fn();
    const onDelete = jest.fn();
    render(<OrderItem order={order} onToggle={onToggle} onDelete={onDelete} />);
    fireEvent.press(screen.getByText("№123456 · Іван"));
    fireEvent.press(screen.getByText("Видалити"));
    expect(onToggle).toHaveBeenCalledWith(order.id);
    expect(onDelete).toHaveBeenCalledWith(order.id);
  });

  test("виконане замовлення має закреслений текст", () => {
    render(<OrderItem order={{ ...order, done: true }} onToggle={() => {}} onDelete={() => {}} />);
    const style = [].concat(...[screen.getByText("№123456 · Іван").props.style].flat());
    expect(JSON.stringify(style)).toContain("line-through");
  });
});

describe("OrderList", () => {
  test("порожній список → повідомлення без підказки", () => {
    render(<OrderList orders={[]} onToggle={() => {}} onDelete={() => {}} />);
    expect(screen.getByText("Замовлень поки немає. Додайте перше!")).toBeTruthy();
    expect(screen.queryByText(/Торкніться замовлення/)).toBeNull();
  });

  test("непорожній список → підказка і всі елементи", () => {
    const second = { ...order, id: "1700000999999", name: "Олена" };
    render(<OrderList orders={[order, second]} onToggle={() => {}} onDelete={() => {}} />);
    expect(screen.getByText("Торкніться замовлення, щоб позначити його виконаним.")).toBeTruthy();
    expect(screen.getByText("№123456 · Іван")).toBeTruthy();
    expect(screen.getByText("№999999 · Олена")).toBeTruthy();
  });
});

describe("OrderForm", () => {
  test("передає значення полів у onAdd і очищає їх, якщо onAdd повернув true", () => {
    const onAdd = jest.fn(() => true);
    render(<OrderForm onAdd={onAdd} />);
    fireEvent.changeText(screen.getByPlaceholderText("Ім’я клієнта"), "Іван");
    fireEvent.changeText(screen.getByPlaceholderText("Телефон, +380…"), "+380501234567");
    fireEvent.changeText(screen.getByPlaceholderText("Сума, ₴"), "10");
    fireEvent.changeText(screen.getByPlaceholderText("Адреса доставки"), "Київ");
    fireEvent.press(screen.getByText("Додати замовлення"));

    expect(onAdd).toHaveBeenCalledWith("Іван", "+380501234567", "Київ", "10");
    expect(screen.getByPlaceholderText("Ім’я клієнта").props.value).toBe("");
  });

  test("якщо onAdd повернув false — поля зберігаються", () => {
    render(<OrderForm onAdd={() => false} />);
    fireEvent.changeText(screen.getByPlaceholderText("Ім’я клієнта"), "Іван");
    fireEvent.press(screen.getByText("Додати замовлення"));
    expect(screen.getByPlaceholderText("Ім’я клієнта").props.value).toBe("Іван");
  });
});
