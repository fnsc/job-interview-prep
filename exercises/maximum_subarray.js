const assert = require("assert");
const { test } = require("./helpers");

/**
 * Problem: Maximum Subarray
 * Given an integer array nums, find the subarray with the largest sum and return its sum.
 * A subarray is a contiguous part of the array.
 *
 * Examples:
 * Input:  nums = [-2, 1, -3, 4, -1, 2, 1, -5, 4]
 * Output: 6
 * // Subarray [4, -1, 2, 1] has the largest sum = 6
 *
 * Input:  nums = [1]
 * Output: 1
 *
 * Input:  nums = [5, 4, -1, 7, 8]
 * Output: 23
 * // The entire array is the subarray
 *
 * Constraints:
 * - 1 <= nums.length <= 10^5
 * - -10^4 <= nums[i] <= 10^4
 */

function maxSubArray(nums) {
  let currentSum = nums[0];
  let maxSum = nums[0];

  for (let i = 1; i < nums.length; i++) {
    if (currentSum <= 0) {
      currentSum = nums[i];
    } else {
      currentSum += nums[i];
    }

    if (maxSum < currentSum) {
      maxSum = currentSum;
    }
  }

  return maxSum
}

// ----------------------------
// Tests
// ----------------------------

console.log("Maximum Subarray:");

test("mixed positive and negative numbers", () => {
  assert.strictEqual(maxSubArray([-2, 1, -3, 4, -1, 2, 1, -5, 4]), 6);
});

test("single element", () => {
  assert.strictEqual(maxSubArray([1]), 1);
});

test("all positive numbers - entire array is the subarray", () => {
  assert.strictEqual(maxSubArray([5, 4, -1, 7, 8]), 23);
});

test("all negative numbers - least negative is the answer", () => {
  assert.strictEqual(maxSubArray([-3, -1, -2]), -1);
});

test("subarray in the middle", () => {
  assert.strictEqual(maxSubArray([-2, -3, 4, -1, -2, 1, 5, -3]), 7);
});
