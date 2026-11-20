// Сторінка не має власної логіки перевірки: усе виконує спільне ядро через window.pharmacyAPI
const nameInput = document.getElementById("medicineName");
const priceInput = document.getElementById("medicinePrice");
const quantityInput = document.getElementById("medicineQuantity");
const addButton = document.getElementById("addMedicineButton");
const searchInput = document.getElementById("searchInput");
const message = document.getElementById("message");
const summary = document.getElementById("summary");
const medicinesList = document.getElementById("medicinesList");

function showMessage(text, color) {
  message.textContent = text;
  message.style.color = color;
}

async function render() {
  const query = searchInput.value;
  const medicines = await window.pharmacyAPI.list(query);
  const { count, total } = await window.pharmacyAPI.summary(query);

  summary.textContent = count
    ? `Усього препаратів: ${count} · Сума: ${total.toFixed(2)} ₴`
    : "Препаратів не знайдено.";
  medicinesList.innerHTML = "";

  medicines.forEach((item) => {
    const li = document.createElement("li");
    li.className = "medicine-item";

    const content = document.createElement("div");
    content.className = "medicine-content";

    const title = document.createElement("span");
    title.className = "medicine-name";
    title.textContent = item.name;

    const details = document.createElement("span");
    details.className = "medicine-details";
    details.textContent = `${item.price.toFixed(2)} ₴ × ${item.quantity} = ${(item.price * item.quantity).toFixed(2)} ₴`;

    const date = document.createElement("span");
    date.className = "medicine-date";
    date.textContent = item.dateLabel;

    content.append(title, details, date);

    const deleteButton = document.createElement("button");
    deleteButton.className = "delete-button";
    deleteButton.textContent = "Видалити";
    deleteButton.addEventListener("click", async () => {
      const result = await window.pharmacyAPI.remove(item.id);
      await render();
      showMessage(result.ok ? "Препарат видалено." : result.error, "#dc2626");
    });

    li.append(content, deleteButton);
    medicinesList.appendChild(li);
  });
}

async function addMedicine() {
  const result = await window.pharmacyAPI.add({
    name: nameInput.value,
    price: priceInput.value,
    quantity: quantityInput.value,
  });

  if (!result.ok) {
    showMessage(result.error, "#dc2626");
    return;
  }

  nameInput.value = "";
  priceInput.value = "";
  quantityInput.value = "1";
  await render();
  showMessage("Препарат успішно додано та збережено у файл.", "#15803d");
}

addButton.addEventListener("click", addMedicine);
[nameInput, priceInput, quantityInput].forEach((input) => {
  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") addMedicine();
  });
});
searchInput.addEventListener("input", render);

document.addEventListener("DOMContentLoaded", render);
