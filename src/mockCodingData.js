// =====================================================
// MOCK CODING PROBLEMS — fallback when backend is offline
// =====================================================

export const MOCK_CODING_PROBLEMS = [
  {
    id: 1,
    title: "Two Sum",
    slug: "two-sum",
    difficulty: "EASY",
    category: "Arrays & Strings",
    description:
      'Given an array of integers `nums` and an integer `target`, return **indices of the two numbers** such that they add up to `target`.\n\nYou may assume that each input would have **exactly one solution**, and you may not use the same element twice.\n\nYou can return the answer in any order.',
    inputFormat: "nums = [2,7,11,15], target = 9",
    outputFormat: "[0,1]",
    constraints:
      "• 2 <= nums.length <= 10^4\n• -10^9 <= nums[i] <= 10^9\n• -10^9 <= target <= 10^9\n• Only one valid answer exists.",
    points: 100,
    xpReward: 50,
    tags: "array,hash-table,two-pointers",
    isDailyChallenge: true,
    orderIndex: 1,
    acceptanceRate: 49.2,
    starterCode: {
      javascript:
        "function twoSum(nums, target) {\n    // Write your code here\n    const map = new Map();\n    for (let i = 0; i < nums.length; i++) {\n        const complement = target - nums[i];\n        if (map.has(complement)) {\n            return [map.get(complement), i];\n        }\n        map.set(nums[i], i);\n    }\n    return [];\n}",
      python:
        "def two_sum(nums: list[int], target: int) -> list[int]:\n    # Write your code here\n    seen = {}\n    for i, num in enumerate(nums):\n        complement = target - num\n        if complement in seen:\n            return [seen[complement], i]\n        seen[num] = i\n    return []",
      java: `class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        // Write your code here\n        java.util.Map<Integer, Integer> map = new java.util.HashMap<>();\n        for (int i = 0; i < nums.length; i++) {\n            int complement = target - nums[i];\n            if (map.containsKey(complement)) {\n                return new int[] { map.get(complement), i };\n            }\n            map.put(nums[i], i);\n        }\n        return new int[]{};\n    }\n}`,
      cpp: `#include <vector>\n#include <unordered_map>\nusing namespace std;\n\nclass Solution {\npublic:\n    vector<int> twoSum(vector<int>& nums, int target) {\n        unordered_map<int, int> seen;\n        for (int i = 0; i < nums.size(); i++) {\n            int complement = target - nums[i];\n            if (seen.count(complement)) {\n                return {seen[complement], i};\n            }\n            seen[nums[i]] = i;\n        }\n        return {};\n    }\n};`,
    },
    hints: [
      "A brute force approach checks all pairs in O(N^2) time. Can we do better?",
      "Can we use a Hash Map to check if the complement (target - nums[i]) has already been seen in O(1) time?",
      "Store each number and its index in a hash map as you iterate through the array.",
    ],
    sampleTestCases: [
      { input: "[2,7,11,15], 9", expectedOutput: "[0,1]", explanation: "nums[0] + nums[1] == 9, return [0, 1]" },
      { input: "[3,2,4], 6", expectedOutput: "[1,2]", explanation: "nums[1] + nums[2] == 6, return [1, 2]" },
      { input: "[3,3], 6", expectedOutput: "[0,1]", explanation: "nums[0] + nums[1] == 6, return [0, 1]" },
    ],
    allTestCases: [
      { input: "[2,7,11,15], 9", expectedOutput: "[0,1]", isSample: true, explanation: "nums[0] + nums[1] == 9" },
      { input: "[3,2,4], 6", expectedOutput: "[1,2]", isSample: true, explanation: "nums[1] + nums[2] == 6" },
      { input: "[3,3], 6", expectedOutput: "[0,1]", isSample: true, explanation: "nums[0] + nums[1] == 6" },
      { input: "[1,5,8,12,19], 20", expectedOutput: "[0,4]", isSample: false, explanation: "Hidden testcase" },
      { input: "[-3,4,3,90], 0", expectedOutput: "[0,2]", isSample: false, explanation: "Negative numbers" },
    ],
    solutionExplanation:
      "### Optimal Solution: Hash Map in One Pass\n\nBy storing elements in a Hash Map as we iterate, we can check for `target - nums[i]` in O(1) amortized time.\n\n- **Time Complexity:** O(N)\n- **Space Complexity:** O(N)",
  },
  {
    id: 2,
    title: "Valid Palindrome",
    slug: "valid-palindrome",
    difficulty: "EASY",
    category: "Arrays & Strings",
    description:
      'A phrase is a **palindrome** if, after converting all uppercase letters into lowercase letters and removing all non-alphanumeric characters, it reads the same forward and backward.\n\nGiven a string `s`, return `true` if it is a palindrome, or `false` otherwise.',
    inputFormat: 's = "A man, a plan, a canal: Panama"',
    outputFormat: "true",
    constraints: "• 1 <= s.length <= 2 * 10^5\n• s consists only of printable ASCII characters.",
    points: 100,
    xpReward: 50,
    tags: "string,two-pointers",
    orderIndex: 2,
    acceptanceRate: 44.8,
    starterCode: {
      javascript:
        "function isPalindrome(s) {\n    // Write your code here\n    const clean = s.toLowerCase().replace(/[^a-z0-9]/g, '');\n    return clean === clean.split('').reverse().join('');\n}",
      python:
        "def is_palindrome(s: str) -> bool:\n    # Write your code here\n    clean = ''.join(c.lower() for c in s if c.isalnum())\n    return clean == clean[::-1]",
      java: `class Solution {\n    public boolean isPalindrome(String s) {\n        // Write your code here\n        String clean = s.replaceAll("[^a-zA-Z0-9]", "").toLowerCase();\n        return clean.equals(new StringBuilder(clean).reverse().toString());\n    }\n}`,
    },
    hints: [
      "Filter out all non-alphanumeric characters and convert to lowercase.",
      "Use two pointers starting from left and right moving inward.",
    ],
    sampleTestCases: [
      { input: '"A man, a plan, a canal: Panama"', expectedOutput: "true", explanation: '"amanaplanacanalpanama" is a palindrome.' },
      { input: '"race a car"', expectedOutput: "false", explanation: '"raceacar" is not a palindrome.' },
      { input: '" "', expectedOutput: "true", explanation: "Empty string reads same forward and backward." },
    ],
    allTestCases: [
      { input: '"A man, a plan, a canal: Panama"', expectedOutput: "true", isSample: true },
      { input: '"race a car"', expectedOutput: "false", isSample: true },
      { input: '" "', expectedOutput: "true", isSample: true },
      { input: '"0P"', expectedOutput: "false", isSample: false },
    ],
    solutionExplanation:
      "### Two Pointer Approach\n\nClean the string, then use two pointers from both ends moving inward.\n\n- **Time:** O(N)\n- **Space:** O(1)",
  },
  {
    id: 3,
    title: "Binary Search",
    slug: "binary-search",
    difficulty: "EASY",
    category: "Sorting & Searching",
    description:
      "Given an array of integers `nums` which is sorted in ascending order, and an integer `target`, write a function to search `target` in `nums`.\n\nIf `target` exists, then return its **index**. Otherwise, return `-1`.\n\nYou must write an algorithm with O(log n) runtime complexity.",
    inputFormat: "nums = [-1,0,3,5,9,12], target = 9",
    outputFormat: "4",
    constraints:
      "• 1 <= nums.length <= 10^4\n• -10^4 < nums[i], target < 10^4\n• All integers in nums are unique.\n• nums is sorted in ascending order.",
    points: 100,
    xpReward: 50,
    tags: "binary-search,array",
    orderIndex: 3,
    acceptanceRate: 52.1,
    starterCode: {
      javascript:
        "function search(nums, target) {\n    let left = 0;\n    let right = nums.length - 1;\n    while (left <= right) {\n        const mid = Math.floor((left + right) / 2);\n        if (nums[mid] === target) return mid;\n        if (nums[mid] < target) left = mid + 1;\n        else right = mid - 1;\n    }\n    return -1;\n}",
      python:
        "def search(nums: list[int], target: int) -> int:\n    left, right = 0, len(nums) - 1\n    while left <= right:\n        mid = (left + right) // 2\n        if nums[mid] == target:\n            return mid\n        elif nums[mid] < target:\n            left = mid + 1\n        else:\n            right = mid - 1\n    return -1",
      java: `class Solution {\n    public int search(int[] nums, int target) {\n        int left = 0, right = nums.length - 1;\n        while (left <= right) {\n            int mid = left + (right - left) / 2;\n            if (nums[mid] == target) return mid;\n            else if (nums[mid] < target) left = mid + 1;\n            else right = mid - 1;\n        }\n        return -1;\n    }\n}`,
    },
    hints: [
      "Maintain two pointers `left` and `right`.",
      "Calculate `mid = (left + right) / 2` and divide search space in half.",
    ],
    sampleTestCases: [
      { input: "[-1,0,3,5,9,12], 9", expectedOutput: "4", explanation: "9 exists in nums and its index is 4" },
      { input: "[-1,0,3,5,9,12], 2", expectedOutput: "-1", explanation: "2 does not exist in nums so return -1" },
    ],
    allTestCases: [
      { input: "[-1,0,3,5,9,12], 9", expectedOutput: "4", isSample: true },
      { input: "[-1,0,3,5,9,12], 2", expectedOutput: "-1", isSample: true },
      { input: "[5], 5", expectedOutput: "0", isSample: false },
    ],
    solutionExplanation:
      "### Binary Search\n\nDivide the sorted array in half each iteration.\n\n- **Time:** O(log N)\n- **Space:** O(1)",
  },
  {
    id: 4,
    title: "Maximum Subarray",
    slug: "maximum-subarray",
    difficulty: "MEDIUM",
    category: "Dynamic Programming",
    description:
      "Given an integer array `nums`, find the subarray with the largest sum, and return **its sum**.\n\nA **subarray** is a contiguous non-empty sequence of elements within an array.",
    inputFormat: "nums = [-2,1,-3,4,-1,2,1,-5,4]",
    outputFormat: "6",
    constraints: "• 1 <= nums.length <= 10^5\n• -10^4 <= nums[i] <= 10^4",
    points: 150,
    xpReward: 100,
    tags: "array,dynamic-programming,divide-and-conquer",
    orderIndex: 4,
    acceptanceRate: 50.4,
    starterCode: {
      javascript:
        "function maxSubArray(nums) {\n    let maxSum = nums[0];\n    let currentSum = nums[0];\n    for (let i = 1; i < nums.length; i++) {\n        currentSum = Math.max(nums[i], currentSum + nums[i]);\n        maxSum = Math.max(maxSum, currentSum);\n    }\n    return maxSum;\n}",
      python:
        "def max_sub_array(nums: list[int]) -> int:\n    max_sum = current_sum = nums[0]\n    for num in nums[1:]:\n        current_sum = max(num, current_sum + num)\n        max_sum = max(max_sum, current_sum)\n    return max_sum",
      java: `class Solution {\n    public int maxSubArray(int[] nums) {\n        int max = nums[0], cur = nums[0];\n        for (int i = 1; i < nums.length; i++) {\n            cur = Math.max(nums[i], cur + nums[i]);\n            max = Math.max(max, cur);\n        }\n        return max;\n    }\n}`,
    },
    hints: [
      "Think about Kadane's Algorithm.",
      "At each step, decide whether to add the current element to the existing running sum or start a new subarray from this element.",
    ],
    sampleTestCases: [
      { input: "[-2,1,-3,4,-1,2,1,-5,4]", expectedOutput: "6", explanation: "The subarray [4,-1,2,1] has the largest sum 6." },
      { input: "[1]", expectedOutput: "1", explanation: "Single element subarray [1] has sum 1." },
      { input: "[5,4,-1,7,8]", expectedOutput: "23", explanation: "The subarray [5,4,-1,7,8] has the largest sum 23." },
    ],
    allTestCases: [
      { input: "[-2,1,-3,4,-1,2,1,-5,4]", expectedOutput: "6", isSample: true },
      { input: "[1]", expectedOutput: "1", isSample: true },
      { input: "[5,4,-1,7,8]", expectedOutput: "23", isSample: true },
    ],
    solutionExplanation:
      "### Kadane's Algorithm\n\nTrack the maximum subarray sum ending at each position.\n\n- **Time:** O(N)\n- **Space:** O(1)",
  },
  {
    id: 5,
    title: "Coin Change",
    slug: "coin-change",
    difficulty: "MEDIUM",
    category: "Dynamic Programming",
    description:
      "You are given an integer array `coins` representing coins of different denominations and an integer `amount` representing a total amount of money.\n\nReturn the **fewest number of coins** that you need to make up that amount. If that amount of money cannot be made up by any combination of the coins, return `-1`.\n\nYou may assume that you have an infinite number of each kind of coin.",
    inputFormat: "coins = [1,2,5], amount = 11",
    outputFormat: "3",
    constraints:
      "• 1 <= coins.length <= 12\n• 1 <= coins[i] <= 2^31 - 1\n• 0 <= amount <= 10^4",
    points: 150,
    xpReward: 100,
    tags: "dynamic-programming,breadth-first-search",
    orderIndex: 5,
    acceptanceRate: 41.3,
    starterCode: {
      javascript:
        "function coinChange(coins, amount) {\n    const dp = new Array(amount + 1).fill(Infinity);\n    dp[0] = 0;\n    for (let i = 1; i <= amount; i++) {\n        for (const coin of coins) {\n            if (i - coin >= 0) {\n                dp[i] = Math.min(dp[i], dp[i - coin] + 1);\n            }\n        }\n    }\n    return dp[amount] === Infinity ? -1 : dp[amount];\n}",
      python:
        "def coin_change(coins: list[int], amount: int) -> int:\n    dp = [float('inf')] * (amount + 1)\n    dp[0] = 0\n    for i in range(1, amount + 1):\n        for coin in coins:\n            if i - coin >= 0:\n                dp[i] = min(dp[i], dp[i - coin] + 1)\n    return dp[amount] if dp[amount] != float('inf') else -1",
      java: `class Solution {\n    public int coinChange(int[] coins, int amount) {\n        int[] dp = new int[amount + 1];\n        java.util.Arrays.fill(dp, amount + 1);\n        dp[0] = 0;\n        for (int i = 1; i <= amount; i++) {\n            for (int coin : coins) {\n                if (i - coin >= 0) dp[i] = Math.min(dp[i], dp[i - coin] + 1);\n            }\n        }\n        return dp[amount] > amount ? -1 : dp[amount];\n    }\n}`,
    },
    hints: [
      "Use dynamic programming bottom-up table `dp[i]` representing min coins for amount `i`.",
      "Base case: `dp[0] = 0`.",
    ],
    sampleTestCases: [
      { input: "[1,2,5], 11", expectedOutput: "3", explanation: "11 = 5 + 5 + 1 (3 coins)" },
      { input: "[2], 3", expectedOutput: "-1", explanation: "Cannot make amount 3 with only 2-cent coins." },
      { input: "[1], 0", expectedOutput: "0", explanation: "0 amount requires 0 coins." },
    ],
    allTestCases: [
      { input: "[1,2,5], 11", expectedOutput: "3", isSample: true },
      { input: "[2], 3", expectedOutput: "-1", isSample: true },
      { input: "[1], 0", expectedOutput: "0", isSample: true },
    ],
    solutionExplanation:
      "### Bottom-Up DP\n\nBuild a table where `dp[i]` is the fewest coins to make amount `i`.\n\n- **Time:** O(amount * coins.length)\n- **Space:** O(amount)",
  },
  {
    id: 6,
    title: "Merge Intervals",
    slug: "merge-intervals",
    difficulty: "MEDIUM",
    category: "Sorting & Searching",
    description:
      "Given an array of `intervals` where `intervals[i] = [start_i, end_i]`, merge all overlapping intervals, and return an array of the non-overlapping intervals that cover all the intervals in the input.",
    inputFormat: "intervals = [[1,3],[2,6],[8,10],[15,18]]",
    outputFormat: "[[1,6],[8,10],[15,18]]",
    constraints:
      "• 1 <= intervals.length <= 10^4\n• intervals[i].length == 2\n• 0 <= start_i <= end_i <= 10^4",
    points: 150,
    xpReward: 100,
    tags: "array,sorting",
    orderIndex: 6,
    acceptanceRate: 46.7,
    starterCode: {
      javascript:
        "function merge(intervals) {\n    if (!intervals.length) return [];\n    intervals.sort((a, b) => a[0] - b[0]);\n    const result = [intervals[0]];\n    for (let i = 1; i < intervals.length; i++) {\n        const last = result[result.length - 1];\n        const current = intervals[i];\n        if (current[0] <= last[1]) {\n            last[1] = Math.max(last[1], current[1]);\n        } else {\n            result.push(current);\n        }\n    }\n    return result;\n}",
      python:
        "def merge(intervals: list[list[int]]) -> list[list[int]]:\n    if not intervals: return []\n    intervals.sort(key=lambda x: x[0])\n    merged = [intervals[0]]\n    for current in intervals[1:]:\n        last = merged[-1]\n        if current[0] <= last[1]:\n            last[1] = max(last[1], current[1])\n        else:\n            merged.append(current)\n    return merged",
      java: `class Solution {\n    public int[][] merge(int[][] intervals) {\n        java.util.Arrays.sort(intervals, (a, b) -> Integer.compare(a[0], b[0]));\n        java.util.List<int[]> merged = new java.util.ArrayList<>();\n        int[] current = intervals[0];\n        merged.add(current);\n        for (int[] interval : intervals) {\n            if (interval[0] <= current[1]) {\n                current[1] = Math.max(current[1], interval[1]);\n            } else {\n                current = interval;\n                merged.add(current);\n            }\n        }\n        return merged.toArray(new int[merged.size()][]);\n    }\n}`,
    },
    hints: [
      "Sort intervals by starting time first.",
      "Then iterate and compare current interval start with previous interval end.",
    ],
    sampleTestCases: [
      { input: "[[1,3],[2,6],[8,10],[15,18]]", expectedOutput: "[[1,6],[8,10],[15,18]]", explanation: "Since intervals [1,3] and [2,6] overlap, merge them into [1,6]." },
      { input: "[[1,4],[4,5]]", expectedOutput: "[[1,5]]", explanation: "Intervals [1,4] and [4,5] are considered overlapping." },
    ],
    allTestCases: [
      { input: "[[1,3],[2,6],[8,10],[15,18]]", expectedOutput: "[[1,6],[8,10],[15,18]]", isSample: true },
      { input: "[[1,4],[4,5]]", expectedOutput: "[[1,5]]", isSample: true },
    ],
    solutionExplanation:
      "### Sort + Linear Scan\n\nSort by start time, then merge overlapping intervals in one pass.\n\n- **Time:** O(N log N)\n- **Space:** O(N)",
  },
  {
    id: 7,
    title: "Longest Substring Without Repeating Characters",
    slug: "longest-substring-without-repeating-characters",
    difficulty: "MEDIUM",
    category: "Arrays & Strings",
    description:
      'Given a string `s`, find the length of the **longest substring** without repeating characters.',
    inputFormat: 's = "abcabcbb"',
    outputFormat: "3",
    constraints:
      "• 0 <= s.length <= 5 * 10^4\n• s consists of English letters, digits, symbols and spaces.",
    points: 150,
    xpReward: 100,
    tags: "hash-table,string,sliding-window",
    orderIndex: 7,
    acceptanceRate: 33.8,
    starterCode: {
      javascript:
        "function lengthOfLongestSubstring(s) {\n    let maxLen = 0, left = 0;\n    const seen = new Map();\n    for (let right = 0; right < s.length; right++) {\n        const char = s[right];\n        if (seen.has(char) && seen.get(char) >= left) {\n            left = seen.get(char) + 1;\n        }\n        seen.set(char, right);\n        maxLen = Math.max(maxLen, right - left + 1);\n    }\n    return maxLen;\n}",
      python:
        "def length_of_longest_substring(s: str) -> int:\n    max_len = left = 0\n    seen = {}\n    for right, char in enumerate(s):\n        if char in seen and seen[char] >= left:\n            left = seen[char] + 1\n        seen[char] = right\n        max_len = max(max_len, right - left + 1)\n    return max_len",
      java: `class Solution {\n    public int lengthOfLongestSubstring(String s) {\n        int max = 0, left = 0;\n        java.util.Map<Character, Integer> map = new java.util.HashMap<>();\n        for (int right = 0; right < s.length(); right++) {\n            char c = s.charAt(right);\n            if (map.containsKey(c) && map.get(c) >= left) {\n                left = map.get(c) + 1;\n            }\n            map.put(c, right);\n            max = Math.max(max, right - left + 1);\n        }\n        return max;\n    }\n}`,
    },
    hints: [
      "Use the Sliding Window technique with two pointers `left` and `right`.",
      "Keep track of the last seen position of each character.",
    ],
    sampleTestCases: [
      { input: '"abcabcbb"', expectedOutput: "3", explanation: 'The answer is "abc", with the length of 3.' },
      { input: '"bbbbb"', expectedOutput: "1", explanation: 'The answer is "b", with the length of 1.' },
      { input: '"pwwkew"', expectedOutput: "3", explanation: 'The answer is "wke", with the length of 3.' },
    ],
    allTestCases: [
      { input: '"abcabcbb"', expectedOutput: "3", isSample: true },
      { input: '"bbbbb"', expectedOutput: "1", isSample: true },
      { input: '"pwwkew"', expectedOutput: "3", isSample: true },
    ],
    solutionExplanation:
      "### Sliding Window\n\nUse a window [left, right] and a hash map to track last-seen positions.\n\n- **Time:** O(N)\n- **Space:** O(min(N, charset))",
  },
];

// Derive stats from the mock problems list
export function getMockStats(problems) {
  const easy = problems.filter((p) => p.difficulty === "EASY");
  const medium = problems.filter((p) => p.difficulty === "MEDIUM");
  const hard = problems.filter((p) => p.difficulty === "HARD");
  return {
    totalProblems: problems.length,
    easyTotal: easy.length,
    mediumTotal: medium.length,
    hardTotal: hard.length,
    userSolved: 0,
    userSolvedEasy: 0,
    userSolvedMedium: 0,
    userSolvedHard: 0,
    userTotalXp: 0,
  };
}

export function getMockCategories(problems) {
  return [...new Set(problems.map((p) => p.category))].sort();
}
