import CartItem from "./CartItem.jsx";
import OrderForm from "./OrderForm.jsx";
import PageTitle from "./PageTitle.jsx";
import { money } from "../utils/format.js";
function Cart({ cart, onChangeQty, onRemove, onPlaceOrder, onGoCatalog }) {
  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const count = cart.reduce((sum, item) => sum + item.qty, 0);
  return (
    <section>
      <PageTitle title="Кошик" subtitle="Перевірте замовлення та вкажіть дані для доставки" />
      {cart.length === 0 ? (
        <p className="text-slate-500">
          Кошик порожній.{" "}
          <button onClick={onGoCatalog} className="cursor-pointer text-emerald-700 underline">
            Перейти до каталогу
          </button>
        </p>
      ) : (
        <>
          <p className="mb-4 text-slate-600">
            Позицій: {cart.length} · Усього одиниць: {count}
          </p>
          <ul className="space-y-3">
            {cart.map((item) => (
              <CartItem key={item.id} item={item} onChangeQty={onChangeQty} onRemove={onRemove} />
            ))}
          </ul>
          <p className="mt-4 text-right text-xl">
            Разом: <strong>{money(total)}</strong>
          </p>
          <OrderForm onPlaceOrder={onPlaceOrder} />
        </>
      )}
    </section>
  );
}
export default Cart;
