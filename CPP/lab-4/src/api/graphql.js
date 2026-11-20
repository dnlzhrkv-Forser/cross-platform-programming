// Імпорт каталогу з GraphQL API із ЛР №3 (запускається командою npm run dev у теці lab-3)
const GRAPHQL_URL = import.meta.env.VITE_GRAPHQL_URL || "http://localhost:4001/";
const QUERY = `query {
medicines { id name category manufacturer price prescriptionRequired description }
}`;
export async function fetchMedicines() {
  const response = await fetch(GRAPHQL_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: QUERY }),
  });
  const json = await response.json();
  if (json.errors) throw new Error(json.errors[0].message);
  return json.data.medicines;
}
