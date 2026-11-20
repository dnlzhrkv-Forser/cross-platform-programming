import test from "node:test";
import assert from "node:assert/strict";
import {
  countChars,
  hasLetter,
  hasOnlyAllowedNameChars,
  isPlainDecimal,
  isPlainInteger,
  normalizeSpaces,
} from "../inputChecks.js";

test("normalizeSpaces прибирає зайві пробіли, табуляції й переноси", () => {
  assert.equal(normalizeSpaces("  а   б\t\nв  "), "а б в");
});

test("countChars рахує символи, а не кодові одиниці", () => {
  assert.equal(countChars("Аспірин"), 7);
  assert.equal(countChars("😀"), 1);
});

test("hasLetter: потрібна хоча б одна літера", () => {
  assert.equal(hasLetter("500 мг"), true);
  assert.equal(hasLetter("C1"), true);
  assert.equal(hasLetter("12345"), false);
  assert.equal(hasLetter("+-./"), false);
});

test("hasOnlyAllowedNameChars відсікає службові символи", () => {
  assert.equal(hasOnlyAllowedNameChars("Но-шпа 40 мг (таблетки), 20 шт."), true);
  for (const bad of ["a<b", "a>b", "a;b", 'a"b', "a\\b", "a{b}", "a_b", "a@b", "a#b"]) {
    assert.equal(hasOnlyAllowedNameChars(bad), false, bad);
  }
});

test("isPlainInteger приймає лише цифри", () => {
  assert.equal(isPlainInteger("42"), true);
  assert.equal(isPlainInteger(" 42 "), true);
  for (const bad of ["", "4 2", "4.2", "-4", "+4", "4e1", "0x1", "abc"]) {
    assert.equal(isPlainInteger(bad), false, JSON.stringify(bad));
  }
});

test("isPlainDecimal: крапка або кома, обмежена кількість знаків", () => {
  assert.equal(isPlainDecimal("45"), true);
  assert.equal(isPlainDecimal("45.5"), true);
  assert.equal(isPlainDecimal("45,50"), true);
  assert.equal(isPlainDecimal("45.555"), false);
  assert.equal(isPlainDecimal("45.555", 3), true);
  for (const bad of ["", ".5", "5.", "1e3", "-1", "1,2,3", "abc"]) {
    assert.equal(isPlainDecimal(bad), false, JSON.stringify(bad));
  }
});
