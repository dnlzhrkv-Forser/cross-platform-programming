"use strict";

/*
 * ЛР №2 з АСД. Варіант 7.
 * Для заданого x знайти індекс останнього елемента A[i], для якого A[i] <= x,
 * та кількість елементів, що не більші за x.
 * Якщо такого елемента немає, повернути -1 і кількість 0.
 *
 * Ключове порівняння: порівняння елемента масиву з x (один раз за ітерацію).
 * Службові перевірки (межі індексів, порожність області) рахуємо окремо.
 */

// ---------- Одновимірний пошук ----------

// 1. Звичайний лінійний пошук.
// Умова зупинки: A[i] > x (перший елемент, більший за x) або i == N.
function linearSearch(A, x) {
  const N = A.length;
  let i = 0;
  let cmp = 0;      // ключові порівняння
  let service = 0;  // службові перевірки i < N

  while (true) {
    service++;
    if (i >= N) break;       // вихід за межі масиву
    cmp++;
    if (A[i] > x) break;     // умова зупинки
    i++;
  }
  // елементи A[0..i-1] <= x
  return { index: i - 1, count: i, cmp, service };
}

// 2. Лінійний пошук з бар'єром.
// Бар'єр: A[N] = Infinity (гарантовано > x), тому перевірка i < N не потрібна.
function barrierSearch(A, x) {
  const N = A.length;
  let i = 0;
  let cmp = 0;

  A.push(Infinity);          // ставимо бар'єр
  while (true) {
    cmp++;
    if (A[i] > x) break;     // зупиняємось на реальному елементі або на бар'єрі
    i++;
  }
  A.pop();                   // відновлюємо початковий масив

  const barrierFired = (i === N); // true: усі елементи <= x, зупинив бар'єр
  return { index: i - 1, count: i, cmp, service: 0, barrierFired };
}

// 3. Бінарний пошук (пошук правої межі: останній A[i] <= x).
function binarySearch(A, x) {
  let lo = 0;
  let hi = A.length - 1;
  let ans = -1;
  let cmp = 0;
  let service = 0;

  while (true) {
    service++;
    if (lo > hi) break;                 // область пошуку порожня
    const mid = Math.floor((lo + hi) / 2);
    cmp++;
    if (A[mid] <= x) {
      ans = mid;                        // кандидат; шукаємо далі праворуч
      lo = mid + 1;                     // ліва частина відкидається
    } else {
      hi = mid - 1;                     // права частина відкидається
    }
  }
  return { index: ans, count: ans + 1, cmp, service };
}

// ---------- Двовимірний пошук ----------

// Повний послідовний перегляд матриці
function matrixFullScan(B, x) {
  let cmp = 0;
  for (let i = 0; i < B.length; i++) {
    for (let j = 0; j < B[i].length; j++) {
      cmp++;
      if (B[i][j] === x) return { found: true, row: i, col: j, cmp };
    }
  }
  return { found: false, row: -1, col: -1, cmp };
}

// Бінарний пошук у кожному рядку (один виклик порівняння A[mid] з x = 1)
function matrixBinaryRows(B, x) {
  let cmp = 0;
  for (let i = 0; i < B.length; i++) {
    let lo = 0;
    let hi = B[i].length - 1;
    while (lo <= hi) {
      const mid = Math.floor((lo + hi) / 2);
      const v = B[i][mid];
      cmp++;                              // тристоронє порівняння v з x
      if (v === x) return { found: true, row: i, col: mid, cmp };
      if (v < x) lo = mid + 1;
      else hi = mid - 1;
    }
  }
  return { found: false, row: -1, col: -1, cmp };
}

// ---------- Тестові дані ----------

const A = [3, 5, 5, 8, 12, 12, 12, 15, 19, 23, 23, 27, 31,
           34, 34, 34, 40, 45, 51, 51, 58, 62, 67, 67, 75]; // N = 25

const B = [
  [4, 7, 7, 12, 15, 21, 21, 30, 33, 38, 41, 50],
  [2, 9, 14, 14, 18, 25, 29, 29, 36, 44, 47, 49],
  [6, 8, 11, 19, 19, 23, 27, 35, 35, 40, 46, 52],
  [1, 5, 10, 13, 17, 17, 22, 26, 31, 39, 43, 48],
  [3, 12, 16, 20, 24, 28, 32, 34, 37, 42, 45, 51],
  [5, 9, 15, 18, 21, 25, 25, 30, 33, 38, 44, 53],
];

// ---------- Перевірка та порівняння ----------

const pad = (s, n) => String(s).padStart(n, " ");

console.log("Масив A (N = " + A.length + "):");
console.log(A.join(", "));
console.log("\n=== Частина 1. Одновимірний пошук, варіант 7 ===");
console.log(
  pad("x", 4) + " | " + pad("index", 5) + " " + pad("count", 5) +
  " | " + pad("ЛІН", 4) + " " + pad("(служб)", 7) +
  " | " + pad("БАР", 4) + " " + pad("бар'єр?", 7) +
  " | " + pad("БІН", 4) + " " + pad("(служб)", 7) + " | збіг"
);

const queries = [1, 3, 4, 12, 20, 34, 51, 66, 75, 100];
for (const x of queries) {
  const lenBefore = A.length;
  const r1 = linearSearch(A, x);
  const r2 = barrierSearch(A, x);
  const r3 = binarySearch(A, x);
  const same =
    r1.index === r2.index && r2.index === r3.index &&
    r1.count === r2.count && r2.count === r3.count &&
    A.length === lenBefore;
  console.log(
    pad(x, 4) + " | " + pad(r1.index, 5) + " " + pad(r1.count, 5) +
    " | " + pad(r1.cmp, 4) + " " + pad(r1.service, 7) +
    " | " + pad(r2.cmp, 4) + " " + pad(r2.barrierFired ? "так" : "ні", 7) +
    " | " + pad(r3.cmp, 4) + " " + pad(r3.service, 7) +
    " | " + (same ? "так" : "НІ")
  );
}

// Автоматична перевірка на випадкових масивах (еталон — простий підрахунок)
function reference(A, x) {
  let idx = -1, cnt = 0;
  for (let i = 0; i < A.length; i++) {
    if (A[i] <= x) { idx = i; cnt++; }
  }
  return { index: idx, count: cnt };
}

let tests = 0, errors = 0;
for (let t = 0; t < 5000; t++) {
  const n = 1 + Math.floor(Math.random() * 40);
  const arr = [];
  for (let i = 0; i < n; i++) arr.push(Math.floor(Math.random() * 30));
  arr.sort((a, b) => a - b); // дозволено лише для підготовки даних
  const x = Math.floor(Math.random() * 34) - 2;
  const ref = reference(arr, x);
  for (const f of [linearSearch, barrierSearch, binarySearch]) {
    tests++;
    const r = f(arr, x);
    if (r.index !== ref.index || r.count !== ref.count) errors++;
  }
}
console.log("\nВипадкові тести: " + tests + " перевірок, помилок: " + errors);

console.log("\n=== Частина 2. Матриця B (6 x 12), рядки впорядковані ===");
B.forEach(row => console.log(row.map(v => pad(v, 3)).join(" ")));
console.log(
  "\n" + pad("x", 4) + " | " + pad("знайдено", 8) + " | " +
  pad("повний перегляд", 15) + " | " + pad("бін. по рядках", 14) + " | позиція (бін.)"
);

const matrixQueries = [4, 25, 40, 34, 53, 0, 100];
for (const x of matrixQueries) {
  const m1 = matrixFullScan(B, x);
  const m2 = matrixBinaryRows(B, x);
  const ok = m1.found === m2.found &&
             (!m2.found || B[m2.row][m2.col] === x);
  console.log(
    pad(x, 4) + " | " + pad(m2.found ? "так" : "ні", 8) + " | " +
    pad(m1.cmp, 15) + " | " + pad(m2.cmp, 14) + " | " +
    (m2.found ? "(" + m2.row + ", " + m2.col + ")" : "-") +
    (ok ? "" : "  <-- ПОМИЛКА")
  );
}
