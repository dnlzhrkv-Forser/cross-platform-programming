import { useEffect, useState } from "react";
// useState, початкове значення якого береться з localStorage,
// а кожна зміна автоматично записується назад (useEffect із залежністю [value]).
export default function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : initialValue;
    } catch {
      return initialValue; // порожньо або пошкоджений JSON
    }
  });
  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);
  return [value, setValue];
}
