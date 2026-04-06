const assert = require("assert");
const { test } = require("./helpers");

/**
 * Problem: Container With Most Water
 * Given an integer array height of length n, where each element represents
 * a vertical line at position i with height height[i].
 * Find two lines that together with the x-axis form a container that holds the most water.
 * Return the maximum amount of water the container can store.
 *
 * You may not slant the container.
 *
 * Examples:
 * Input:  height = [1, 8, 6, 2, 5, 4, 8, 3, 7]
 * Output: 49
 * // Lines at index 1 (height=8) and index 8 (height=7)
 * // width = 8-1 = 7, height = min(8,7) = 7 → area = 49
 *
 * Input:  height = [1, 1]
 * Output: 1
 *
 * Constraints:
 * - n == height.length
 * - 2 <= n <= 10^5
 * - 0 <= height[i] <= 10^4
 * - The amount of water is width * min(height[left], height[right])
 */

function maxArea(height) {
  // write here
}

// ----------------------------
// Tests
// ----------------------------

console.log("Container With Most Water:");

test("example from problem statement", () => {
  assert.strictEqual(maxArea([1, 8, 6, 2, 5, 4, 8, 3, 7]), 49);
});

test("two elements", () => {
  assert.strictEqual(maxArea([1, 1]), 1);
});

test("increasing heights - best container uses last two", () => {
  assert.strictEqual(maxArea([1, 2, 3, 4, 5]), 6);
});

test("best container is not the widest", () => {
  assert.strictEqual(maxArea([1, 3, 2, 5, 25, 24, 5]), 24);
});
