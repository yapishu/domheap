import test from "node:test";
import assert from "node:assert/strict";
import {
  automaticPrices,
  toAtomic,
  fromAtomic,
  defaultPrices,
} from "../src/pricing.ts";
test("default $5/month prorates each term with exact cents", () => {
  assert.deepEqual(defaultPrices, {
    day: "0.16",
    week: "1.15",
    month: "5",
    year: "60",
  });
  assert.deepEqual(automaticPrices("120", "year"), {
    day: "0.33",
    week: "2.31",
    month: "10",
    year: "120",
  });
});
test("token conversion never rounds a signed payment amount", () => {
  assert.equal(toAtomic("5", 6), "5000000");
  assert.equal(toAtomic("0.16", 6), "160000");
  assert.equal(fromAtomic("160000", 6), "0.16");
  assert.equal(
    toAtomic("123456789012345678.12", 6),
    "123456789012345678120000",
  );
  assert.throws(() => toAtomic("1.001", 2));
  assert.throws(() => toAtomic("-1", 6));
  assert.throws(() => toAtomic("1e3", 6));
});
