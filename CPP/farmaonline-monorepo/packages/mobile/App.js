import { useCallback, useEffect, useState } from "react";
import { Alert, StatusBar, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { MedicinesService, calcTotal } from "@farmaonline/core";
import { AsyncStorageAdapter } from "./asyncStorageAdapter.js";
import Header from "./components/Header";
import MedicineForm from "./components/MedicineForm";
import MedicineList from "./components/MedicineList";

// Власної перевірки тут немає: усе виконує спільний сервіс ядра @farmaonline/core,
// а текст помилки береться з результату add(). Дані зберігаються в AsyncStorage.
const service = new MedicinesService(new AsyncStorageAdapter(AsyncStorage));

export default function App() {
  // Увесь стан застосунку зберігається тут («підняття стану вгору»)
  const [medicines, setMedicines] = useState([]);
  const [query, setQuery] = useState("");

  const refresh = useCallback(async (search) => {
    setMedicines(await service.list(search));
  }, []);

  useEffect(() => {
    refresh(query);
  }, [query, refresh]);

  // Додавання препарату: повертає true, якщо запис додано
  const addMedicine = async (name, price, quantity) => {
    const result = await service.add({ name, price, quantity });
    if (!result.ok) {
      Alert.alert("Помилка", result.error);
      return false;
    }
    await refresh(query);
    Alert.alert("Успіх", "Препарат успішно додано.");
    return true;
  };

  // Видалити препарат зі списку
  const deleteMedicine = async (id) => {
    const result = await service.remove(id);
    await refresh(query);
    Alert.alert(result.ok ? "Видалення" : "Помилка", result.ok ? "Препарат видалено." : result.error);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.container}>
        <Header total={medicines.length} sum={calcTotal(medicines)} />
        <MedicineForm onAdd={addMedicine} />
        <MedicineList
          medicines={medicines}
          query={query}
          onQueryChange={setQuery}
          onDelete={deleteMedicine}
        />
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
