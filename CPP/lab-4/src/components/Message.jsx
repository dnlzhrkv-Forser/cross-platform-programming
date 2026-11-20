function Message({ message }) {
  if (!message) return null;
  return (
    <p
      role="status"
      className={`mb-4 rounded-lg px-4 py-3 font-bold ${
        message.type === "error" ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-700"
      }`}
    >
      {message.text}
    </p>
  );
}
export default Message;
