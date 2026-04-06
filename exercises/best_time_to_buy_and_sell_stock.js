const assert = require("assert");
const { test } = require("./helpers");

/**
 * Problem: Best Time to Buy and Sell Stock
 * Given an array prices where prices[i] is the price of a stock on day i,
 * return the maximum profit you can achieve by buying on one day and selling on a future day.
 * If no profit is possible, return 0.
 *
 * Examples:
 * Input:  prices = [7, 1, 5, 3, 6, 4]
 * Output: 5
 * // Buy on day 1 (price=1), sell on day 4 (price=6) → profit = 6-1 = 5
 *
 * Input:  prices = [7, 6, 4, 3, 1]
 * Output: 0
 * // Prices only decrease — no transaction is worth it
 *
 * Constraints:
 * - You must buy before you sell (no time travel)
 * - Only one buy and one sell allowed
 */
function maxProfit(prices) {
  let minPrice = prices[0];
    let maxProfit = 0

    for (let i = 1; i < prices.length; i++) {
        if (minPrice > prices[i]) {
            minPrice = prices[i];
        }

        if ((prices[i] - minPrice) > maxProfit) {
            maxProfit = prices[i] - minPrice
        }
    }

    return maxProfit;
}

// ----------------------------
// Tests
// ----------------------------

console.log("Best Time to Buy and Sell Stock:");

test("basic case - buy low sell high", () => {
  assert.strictEqual(maxProfit([7, 1, 5, 3, 6, 4]), 5);
});

test("prices only decrease - no profit possible", () => {
  assert.strictEqual(maxProfit([7, 6, 4, 3, 1]), 0);
});

test("best buy is not the first element", () => {
  assert.strictEqual(maxProfit([3, 10, 1, 4]), 7);
});

test("best sell is the last element", () => {
  assert.strictEqual(maxProfit([1, 2, 3, 4, 5]), 4);
});

test("two elements - profit exists", () => {
  assert.strictEqual(maxProfit([1, 2]), 1);
});

test("two elements - no profit", () => {
  assert.strictEqual(maxProfit([2, 1]), 0);
});
