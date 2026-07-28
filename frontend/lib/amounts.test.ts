import assert from "node:assert/strict";
import test from "node:test";
import {
  calculateOdds,
  estimatePayout,
  formatGenAmount,
  parseGenAmount,
  WEI_PER_GEN,
} from "./amounts.ts";

test("converts decimal GEN amounts to wei without floating point", () => {
  assert.equal(parseGenAmount("1"), WEI_PER_GEN);
  assert.equal(parseGenAmount("0.5"), WEI_PER_GEN / 2n);
  assert.equal(parseGenAmount("1.000000000000000001"), WEI_PER_GEN + 1n);
});

test("rejects zero, negative, and over-precise values", () => {
  assert.throws(() => parseGenAmount("0"));
  assert.throws(() => parseGenAmount("-1"));
  assert.throws(() => parseGenAmount("0.0000000000000000001"));
});

test("formats wei as readable GEN", () => {
  assert.equal(formatGenAmount(WEI_PER_GEN), "1");
  assert.equal(formatGenAmount(WEI_PER_GEN + WEI_PER_GEN / 4n), "1.25");
});

test("calculates odds and pari-mutuel payout with bigint", () => {
  const yes = (3n * WEI_PER_GEN).toString();
  const no = WEI_PER_GEN.toString();
  assert.deepEqual(calculateOdds(yes, no), { yes: 75, no: 25 });
  assert.equal(
    estimatePayout("1", yes, no, "NO"),
    (5n * WEI_PER_GEN) / 2n,
  );
});
