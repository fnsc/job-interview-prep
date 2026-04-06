# Microsoft SWE II — Interview Prep

Study repository for Microsoft Software Engineer II interview preparation.

## Approach

Each exercise is solved progressively — brute force first, then optimized. Every solution includes a discussion of time and space complexity (Big O). Exercises increase in difficulty over time.

All exercises are written in JavaScript and run inside Docker.

## Running Exercises

```bash
docker compose run --rm js node exercises/<file>.js
```

## The 10 Algorithm Patterns

Most interview problems map to one of these patterns. The goal is to recognize which pattern applies given a problem you've never seen before.

| # | Pattern | Key Idea | Exercises |
|---|---|---|---|
| 1 | HashMap / HashSet | Trade memory for speed — O(1) lookups | [Two Sum](exercises/two_sum.js) |
| 2 | Two Pointers | Two indices moving toward each other | [Container With Most Water](exercises/container_with_most_water.js) |
| 3 | Sliding Window | Expand/shrink a window over a sequence | — |
| 4 | Binary Search | Halve the search space each step | — |
| 5 | BFS / DFS | Explore graphs and trees layer by layer or deep first | — |
| 6 | Dynamic Programming | Build the answer from smaller subproblems | [Maximum Subarray](exercises/maximum_subarray.js) |
| 7 | Backtracking | Explore all possibilities, prune dead ends | — |
| 8 | Heap / Priority Queue | Efficiently track the k largest/smallest | — |
| 9 | Intervals | Sort and merge overlapping ranges | — |
| 10 | Prefix Sum | Precompute cumulative sums for O(1) range queries | — |

## Exercises

| # | Problem | Pattern | Difficulty | File |
|---|---|---|---|---|
| 1 | Two Sum | HashMap | Easy | [two_sum.js](exercises/two_sum.js) |
| 2 | Best Time to Buy and Sell Stock | Tracking min/max | Easy | [best_time_to_buy_and_sell_stock.js](exercises/best_time_to_buy_and_sell_stock.js) |
| 3 | Maximum Subarray | Dynamic Programming (Kadane's) | Medium | [maximum_subarray.js](exercises/maximum_subarray.js) |
| 4 | Container With Most Water | Two Pointers | Medium | [container_with_most_water.js](exercises/container_with_most_water.js) |

## Topics Covered

- **Algorithms:** arrays, strings, trees, graphs, dynamic programming
- **System Design:** distributed systems, scalability, trade-offs
- **Behavioral:** STAR method, leadership, conflict resolution
