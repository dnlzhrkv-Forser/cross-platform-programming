import { useState } from "react";
import { Alert, StatusBar, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Header from "./components/Header";
import OrderForm from "./components/OrderForm";
import OrderList from "./components/OrderList";

// Телефон у форматі +380501234567 (така сама перевірка, як у вебверсії, ЛР №4)
const PHONE_RE = /^\+?[\d\s()-]{10,15}$/;

export default function App() {
  // Увесь стан застосунку зберігається тут («підняття стану вгору»)
  const [orders, setOrders] = useState([]);

  // Додавання замовлення: перевіряє поля, повертає true, якщо запис додано
  const addOrder = (name, phone, address, total) => {
    const cleanName = name.trim();
    const cleanPhone = phone.trim();
    const cleanAddress = address.trim();
    const cleanTotal = Number(total.trim().replace(",", "."));

    if (cleanName === "") {
      Alert.alert("Помилка", "Будь ласка, введіть ім’я клієнта.");
      return false;
    }
    if (!PHONE_RE.test(cleanPhone)) {
      Alert.alert("Помилка", "Вкажіть коректний телефон, наприклад +380501234567.");
      return false;
    }
    if (cleanAddress === "") {
      Alert.alert("Помилка", "Вкажіть адресу доставки.");
      return false;
    }
    if (!Number.isFinite(cleanTotal) || cleanTotal <= 0) {
      Alert.alert("Помилка", "Сума має бути числом більшим за нуль.");
      return false;
    }

    const newOrder = {
      id: Date.now().toString(),
      name: cleanName,
      phone: cleanPhone,
      address: cleanAddress,
      total: cleanTotal,
      done: false,
    };

    // Нове замовлення додається на початок списку
    setOrders((currentOrders) => [newOrder, ...currentOrders]);
    Alert.alert("Успіх", "Замовлення успішно додано.");
    return true;
  };

  // Позначити замовлення виконаним / повернути назад
  const toggleOrder = (id) => {
    setOrders((currentOrders) =>
      currentOrders.map((order) =>
        order.id === id ? { ...order, done: !order.done } : order
      )
    );
  };

  // Видалити замовлення зі списку
  const deleteOrder = (id) => {
    setOrders((currentOrders) => currentOrders.filter((order) => order.id !== id));
    Alert.alert("Видалення", "Замовлення видалено.");
  };

  const doneCount = orders.filter((order) => order.done).length;
  const totalSum = orders.reduce((sum, order) => sum + order.total, 0);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.container}>
        <Header total={orders.length} done={doneCount} sum={totalSum} />
        <OrderForm onAdd={addOrder} />
        <OrderList orders={orders} onToggle={toggleOrder} onDelete={deleteOrder} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f4f8f6",
  },
  container: {
    flex: 1,
    padding: 20,
  },
});
