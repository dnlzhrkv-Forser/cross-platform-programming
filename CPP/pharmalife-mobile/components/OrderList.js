import { FlatList, StyleSheet, Text, View } from "react-native";
import OrderItem from "./OrderItem";

// Картка зі списком замовлень (FlatList) або повідомленням про порожній список
export default function OrderList({ orders, onToggle, onDelete }) {
  return (
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>Список замовлень</Text>

      {orders.length === 0 ? (
        <Text style={styles.empty}>Замовлень поки немає. Додайте перше!</Text>
      ) : (
        <>
          <Text style={styles.hint}>Торкніться замовлення, щоб позначити його виконаним.</Text>
          <FlatList
            data={orders}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <OrderItem order={item} onToggle={onToggle} onDelete={onDelete} />
            )}
            keyboardShouldPersistTaps="handled"
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1c2b26",
    marginBottom: 8,
  },
  hint: {
    fontSize: 13,
    color: "#5d6f68",
    marginBottom: 12,
  },
  empty: {
    fontSize: 15,
    color: "#5d6f68",
    textAlign: "center",
    marginTop: 12,
  },
});
