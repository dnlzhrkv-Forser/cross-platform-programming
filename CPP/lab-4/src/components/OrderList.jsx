import OrderItem from "./OrderItem.jsx";
function OrderList({ orders, isFiltered, onToggle, onDelete }) {
  if (orders.length === 0) {
    return (
      <p className="text-center text-slate-500">
        {isFiltered ? "Нічого не знайдено за вашим запитом." : "Замовлень поки немає. Оформіть перше в кошику!"}
      </p>
    );
  }
  return (
    <ul className="space-y-3">
      {orders.map((order) => (
        <OrderItem key={order.id} order={order} onToggle={onToggle} onDelete={onDelete} />
      ))}
    </ul>
  );
}
export default OrderList;
