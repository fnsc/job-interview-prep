const assert = require("assert");
const { test } = require("./helpers");

/**
 * Problem: Two Sum
 * Given an array of integers nums and an integer target, return the indices of the two numbers
 * that add up to target.
 * Assume exactly one solution exists, and you may not use the same element twice.
 *
 * Examples:
 * Input:  nums = [2, 7, 11, 15], target = 9
 * Output: [0, 1]   // nums[0] + nums[1] = 2 + 7 = 9
 *
 * Input:  nums = [3, 2, 4], target = 6
 * Output: [1, 2]   // nums[1] + nums[2] = 2 + 4 = 6
 *
 * Constraints:
 * - 2 <= nums.length <= 10^4
 * - -10^9 <= nums[i] <= 10^9
 */
function twoSum(nums, target) {
  const seen = new Map()

  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];

    if (seen.has(complement)) {
      return [seen.get(complement), i]
    }

    seen.set(nums[i], i)
  }
}

// ----------------------------
// Tests
// ----------------------------

console.log("Two Sum:");

test("pair at the beginning of the array", () => {
  assert.deepStrictEqual(twoSum([2, 7, 11, 15], 9), [0, 1]);
});

test("pair in the middle of the array", () => {
  assert.deepStrictEqual(twoSum([3, 2, 4], 6), [1, 2]);
});

test("same number at different positions", () => {
  assert.deepStrictEqual(twoSum([3, 3], 6), [0, 1]);
});

test("negative numbers", () => {
  assert.deepStrictEqual(twoSum([-1, -2, -3, -4, -5], -8), [2, 4]);
});

test("larger array, pair found mid-traversal", () => {
  assert.deepStrictEqual(twoSum([1, 5, 3, 8, 2, 7], 9), [0, 3]);
});
