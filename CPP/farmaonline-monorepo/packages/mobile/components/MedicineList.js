import { FlatList, StyleSheet, Text, TextInput, View } from "react-native";
import MedicineItem from "./MedicineItem";

// Картка зі списком препаратів (FlatList): пошук за назвою або повідомлення про порожній список
export default function MedicineList({ medicines, query, onQueryChange, onDelete }) {
  return (
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>Список препаратів</Text>
      <TextInput
        style={styles.search}
        placeholder="Пошук за назвою"
        value={query}
        onChangeText={onQueryChange}
      />

      {medicines.length === 0 ? (
        <Text style={styles.empty}>Препаратів не знайдено.</Text>
      ) : (
        <FlatList
          data={medicines}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => <MedicineItem medicine={item} onDelete={onDelete} />}
          keyboardShouldPersistTaps="handled"
        />
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
  search: {
    borderWidth: 1,
    borderColor: "#cfe0d8",
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  empty: {
    fontSize: 15,
    color: "#5d6f68",
    textAlign: "center",
    marginTop: 12,
  },
});
