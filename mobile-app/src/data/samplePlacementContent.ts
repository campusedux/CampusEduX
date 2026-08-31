import type {
  AptitudeTopic,
  AptitudeCategory,
  PracticeTest,
  QuizQuestion,
  TestResult,
  PerformanceAnalysis,
  DSATopic,
  DSAProblemSummary,
  DSAProblemDetail,
  HRQuestion,
  PlacementCompany,
  PlacementDashboardSummary,
} from "@/types";

/**
 * Sample content for Module 5 (Placement Preparation). Every placement
 * service read tries Supabase first and falls back here so the 24 screens
 * render like the mockups before the database is seeded.
 */

export const SAMPLE_DASHBOARD: PlacementDashboardSummary = {
  testsTaken: 24,
  questionsSolved: 860,
  accuracyPercent: 66,
  overallProgressPercent: 75,
};

const topic = (id: string, category: AptitudeCategory, name: string, total: number, solved = 0): AptitudeTopic => ({
  id,
  category,
  name,
  totalQuestions: total,
  solvedQuestions: solved,
});

export const SAMPLE_APTITUDE_TOPICS: Record<AptitudeCategory, AptitudeTopic[]> = {
  quantitative: [
    topic("q-1", "quantitative", "Number System", 20),
    topic("q-2", "quantitative", "Algebra", 25),
    topic("q-3", "quantitative", "Geometry", 20),
    topic("q-4", "quantitative", "Mensuration", 20),
    topic("q-5", "quantitative", "Data Interpretation", 20),
    topic("q-6", "quantitative", "Arithmetic", 15),
    topic("q-7", "quantitative", "Modern Maths", 15),
  ],
  logical: [
    topic("l-1", "logical", "Syllogism", 20),
    topic("l-2", "logical", "Coding - Decoding", 18),
    topic("l-3", "logical", "Blood Relations", 20),
    topic("l-4", "logical", "Puzzles", 25),
    topic("l-5", "logical", "Seating Arrangement", 20),
    topic("l-6", "logical", "Direction Sense", 15),
    topic("l-7", "logical", "Statement - Assumption", 15),
  ],
  verbal: [
    topic("v-1", "verbal", "Reading Comprehension", 20),
    topic("v-2", "verbal", "Spotting Errors", 15),
    topic("v-3", "verbal", "Fill in the Blanks", 20),
    topic("v-4", "verbal", "Para Jumbles", 15),
    topic("v-5", "verbal", "Synonyms & Antonyms", 20),
    topic("v-6", "verbal", "Idioms & Phrases", 15),
    topic("v-7", "verbal", "One Word Substitution", 15),
  ],
};

export function samplePracticeTests(filters: { category?: string; companyId?: string } = {}): PracticeTest[] {
  if (filters.companyId) {
    return [
      { id: `${filters.companyId}-mock-1`, title: "TCS Mock Test - 01", category: "company", companyId: filters.companyId, questionCount: 60, durationMinutes: 90, description: "Aptitude, Coding, Reasoning" },
      { id: `${filters.companyId}-mock-2`, title: "TCS Mock Test - 02", category: "company", companyId: filters.companyId, questionCount: 60, durationMinutes: 90, description: "Full length company pattern test" },
      { id: `${filters.companyId}-mock-3`, title: "TCS NQT Practice", category: "company", companyId: filters.companyId, questionCount: 45, durationMinutes: 60, description: "National Qualifier Test pattern" },
    ];
  }
  const cat = (filters.category as PracticeTest["category"]) || "aptitude";
  return Array.from({ length: 6 }, (_, i) => ({
    id: `${cat}-test-${i + 1}`,
    title: `${cat === "aptitude" ? "Aptitude" : cat[0].toUpperCase() + cat.slice(1)} Test - 0${i + 1}`,
    category: cat,
    companyId: null,
    questionCount: 30,
    durationMinutes: 60,
    description: "30 Questions · 60 mins",
  }));
}

export function sampleTestDetail(testId: string): PracticeTest {
  return (
    samplePracticeTests().find((t) => t.id === testId) ??
    samplePracticeTests({ companyId: testId.split("-")[0] }).find((t) => t.id === testId) ?? {
      id: testId,
      title: "Aptitude Test - 01",
      category: "aptitude",
      companyId: null,
      questionCount: 5,
      durationMinutes: 10,
      description: "",
    }
  );
}

export function sampleTestQuestions(): QuizQuestion[] {
  return [
    { id: "tq-1", questionText: "If 3x + 5 = 20, what is the value of 2x + 7?", options: ["15", "17", "19", "21"], correctIndex: 1, explanation: "3x = 15 so x = 5; 2(5) + 7 = 17.", marks: 1 },
    { id: "tq-2", questionText: "A train 120 m long crosses a pole in 6 seconds. Its speed is:", options: ["60 km/h", "72 km/h", "48 km/h", "90 km/h"], correctIndex: 1, explanation: "Speed = 120/6 = 20 m/s = 72 km/h.", marks: 1 },
    { id: "tq-3", questionText: "Find the odd one out: 2, 3, 5, 7, 9, 11", options: ["3", "5", "9", "11"], correctIndex: 2, explanation: "9 is the only non-prime.", marks: 1 },
    { id: "tq-4", questionText: "Choose the synonym of 'Diligent':", options: ["Lazy", "Hardworking", "Careless", "Slow"], correctIndex: 1, explanation: "Diligent means hardworking and careful.", marks: 1 },
    { id: "tq-5", questionText: "The average of 5 numbers is 20. If one number is removed, the average becomes 22. The removed number is:", options: ["10", "12", "14", "16"], correctIndex: 1, explanation: "Sum = 100; remaining sum = 88; removed = 12.", marks: 1 },
  ];
}

export function sampleTestResult(attemptId: string, testTitle = "Aptitude Test - 01"): TestResult {
  return {
    attemptId,
    testTitle,
    score: 24,
    totalMarks: 30,
    correctCount: 24,
    incorrectCount: 6,
    totalQuestions: 30,
    accuracyPercent: 80,
    timeTakenSeconds: 45 * 60,
    sectionScores: [
      { section: "Quantitative", scorePercent: 80 },
      { section: "Reasoning", scorePercent: 75 },
      { section: "Coding", scorePercent: 78 },
    ],
    createdAt: new Date().toISOString(),
  };
}

export const SAMPLE_PERFORMANCE: PerformanceAnalysis = {
  overallAccuracyPercent: 80,
  testsTaken: 24,
  questionsAttempted: 860,
  averageScorePercent: 79,
  trend: [
    { label: "Test 1", scorePercent: 62 },
    { label: "Test 2", scorePercent: 70 },
    { label: "Test 3", scorePercent: 68 },
    { label: "Test 4", scorePercent: 76 },
    { label: "Test 5", scorePercent: 82 },
  ],
  sectionScores: [
    { section: "Quantitative", scorePercent: 65 },
    { section: "Logical Reasoning", scorePercent: 72 },
    { section: "Verbal Ability", scorePercent: 80 },
  ],
};

export const SAMPLE_DSA_TOPICS: DSATopic[] = [
  { id: "dsa-arrays", name: "Arrays", totalProblems: 45, solvedProblems: 30 },
  { id: "dsa-strings", name: "Strings", totalProblems: 30, solvedProblems: 18 },
  { id: "dsa-linked-list", name: "Linked List", totalProblems: 25, solvedProblems: 15 },
  { id: "dsa-trees", name: "Trees", totalProblems: 40, solvedProblems: 20 },
  { id: "dsa-graphs", name: "Graphs", totalProblems: 35, solvedProblems: 12 },
  { id: "dsa-dp", name: "Dynamic Programming", totalProblems: 50, solvedProblems: 15 },
  { id: "dsa-stack-queue", name: "Stack & Queue", totalProblems: 20, solvedProblems: 8 },
  { id: "dsa-sorting", name: "Sorting & Searching", totalProblems: 18, solvedProblems: 4 },
];

export function sampleDSAProblems(): DSAProblemSummary[] {
  return [
    { id: "p-two-sum", title: "Two Sum", difficulty: "Easy", isSolved: true },
    { id: "p-best-time", title: "Best Time to Buy and Sell Stock", difficulty: "Easy", isSolved: true },
    { id: "p-contains-dup", title: "Contains Duplicate", difficulty: "Easy", isSolved: false },
    { id: "p-max-subarray", title: "Maximum Subarray", difficulty: "Medium", isSolved: false },
    { id: "p-product-except", title: "Product of Array Except Self", difficulty: "Medium", isSolved: false },
    { id: "p-rotate-array", title: "Rotate Array", difficulty: "Medium", isSolved: false },
    { id: "p-merge-intervals", title: "Merge Intervals", difficulty: "Hard", isSolved: false },
  ];
}

export function sampleDSAProblemDetail(problemId: string): DSAProblemDetail {
  const title = sampleDSAProblems().find((p) => p.id === problemId)?.title ?? "Two Sum";
  return {
    id: problemId,
    title,
    difficulty: "Easy",
    description:
      "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target. You may assume that each input has exactly one solution, and you may not use the same element twice.",
    examples: [
      { input: "nums = [2,7,11,15], target = 9", output: "[0,1]", explanation: "nums[0] + nums[1] == 9, so we return [0, 1]." },
      { input: "nums = [3,2,4], target = 6", output: "[1,2]" },
    ],
    constraints: ["2 <= nums.length <= 10^4", "-10^9 <= nums[i] <= 10^9", "-10^9 <= target <= 10^9", "Only one valid answer exists."],
    starterCode: {
      python: "class Solution:\n    def twoSum(self, nums, target):\n        # write your code here\n        pass",
      javascript: "function twoSum(nums, target) {\n  // write your code here\n}",
      java: "class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        // write your code here\n        return new int[]{};\n    }\n}",
      cpp: "class Solution {\npublic:\n    vector<int> twoSum(vector<int>& nums, int target) {\n        // write your code here\n        return {};\n    }\n};",
    },
    timeComplexity: "O(n)",
    spaceComplexity: "O(n)",
    solutionApproach:
      "Use a hash map to store each number's index as you iterate. For each number, check if its complement (target - num) already exists in the map; if so, return the stored index and the current index.",
    solutionCode: {
      python: "class Solution:\n    def twoSum(self, nums, target):\n        seen = {}\n        for i, num in enumerate(nums):\n            if target - num in seen:\n                return [seen[target - num], i]\n            seen[num] = i",
      javascript: "function twoSum(nums, target) {\n  const seen = new Map();\n  for (let i = 0; i < nums.length; i++) {\n    if (seen.has(target - nums[i])) return [seen.get(target - nums[i]), i];\n    seen.set(nums[i], i);\n  }\n}",
      java: "public int[] twoSum(int[] nums, int target) {\n    Map<Integer, Integer> seen = new HashMap<>();\n    for (int i = 0; i < nums.length; i++) {\n        if (seen.containsKey(target - nums[i])) return new int[]{seen.get(target - nums[i]), i};\n        seen.put(nums[i], i);\n    }\n    return new int[]{};\n}",
      cpp: "vector<int> twoSum(vector<int>& nums, int target) {\n    unordered_map<int,int> seen;\n    for (int i = 0; i < nums.size(); i++) {\n        if (seen.count(target - nums[i])) return {seen[target - nums[i]], i};\n        seen[nums[i]] = i;\n    }\n    return {};\n}",
    },
    isSolved: sampleDSAProblems().find((p) => p.id === problemId)?.isSolved ?? false,
  };
}

const hr = (id: string, category: string, question: string, tips: string[], sample: string, fav = false): HRQuestion => ({
  id,
  category,
  question,
  answerTips: tips,
  sampleAnswer: sample,
  isFavorite: fav,
});

export const SAMPLE_HR_QUESTIONS: HRQuestion[] = [
  hr("hr-1", "General Questions", "Tell me about yourself.", ["Start with your name and background.", "Talk about your education and skills.", "Mention your achievements.", "End with your career goals."], "I am a final year B.Tech student in Computer Science. I have a strong foundation in Data Structures and Algorithms and have built several projects using Python and React. I am looking forward to working in a challenging environment where I can grow and contribute.", true),
  hr("hr-2", "General Questions", "What are your strengths?", ["Pick 2-3 relevant strengths.", "Back each with a short example.", "Tie them to the role."], "My key strengths are problem solving and consistency. During my last project I debugged a performance issue that halved page load time, and I practice DSA daily which keeps my fundamentals sharp."),
  hr("hr-3", "General Questions", "What is your weakness?", ["Choose a real but non-critical weakness.", "Show the steps you take to improve it."], "I used to hesitate to ask for help early. I now set a 30-minute rule: if I am stuck beyond that, I reach out, which has made me much more efficient."),
  hr("hr-4", "General Questions", "Why should we hire you?", ["Match your skills to the job description.", "Show enthusiasm for the company.", "Be confident, not arrogant."], "I bring strong fundamentals, hands-on project experience and a genuine eagerness to learn. I have followed your company's engineering culture and I am confident I can add value quickly."),
  hr("hr-5", "Career Questions", "Where do you see yourself in 5 years?", ["Show ambition aligned with the company.", "Focus on growth and contribution, not titles."], "In five years I see myself as a strong engineer who has grown into leading small features end to end and mentoring newer teammates, while continuing to deepen my technical expertise."),
];

export function sampleFavoriteQuestions(): HRQuestion[] {
  return SAMPLE_HR_QUESTIONS.filter((q) => q.isFavorite).map((q) => ({ ...q, isFavorite: true }));
}

export const SAMPLE_PLACEMENT_COMPANIES: PlacementCompany[] = [
  { id: "tcs", name: "TCS", logoUrl: null, questionsCount: 135, mockTestsCount: 10, questionsSolved: 62 },
  { id: "infosys", name: "Infosys", logoUrl: null, questionsCount: 90, mockTestsCount: 8, questionsSolved: 40 },
  { id: "wipro", name: "Wipro", logoUrl: null, questionsCount: 85, mockTestsCount: 7, questionsSolved: 30 },
  { id: "accenture", name: "Accenture", logoUrl: null, questionsCount: 70, mockTestsCount: 6, questionsSolved: 22 },
  { id: "cognizant", name: "Cognizant", logoUrl: null, questionsCount: 65, mockTestsCount: 5, questionsSolved: 15 },
  { id: "capgemini", name: "Capgemini", logoUrl: null, questionsCount: 60, mockTestsCount: 5, questionsSolved: 10 },
];

export function sampleCompanyQuestions(companyId: string): HRQuestion[] {
  return SAMPLE_HR_QUESTIONS.map((q, i) => ({
    ...q,
    id: `${companyId}-${q.id}`,
    category: i % 2 === 0 ? "Technical" : "HR",
    isFavorite: false,
  }));
}

export const SAMPLE_COMPANY_PERFORMANCE: PerformanceAnalysis = {
  overallAccuracyPercent: 78,
  testsTaken: 5,
  questionsAttempted: 300,
  averageScorePercent: 76,
  trend: [
    { label: "Test 1", scorePercent: 64 },
    { label: "Test 2", scorePercent: 71 },
    { label: "Test 3", scorePercent: 74 },
    { label: "Test 4", scorePercent: 79 },
    { label: "Test 5", scorePercent: 82 },
  ],
  sectionScores: [
    { section: "Aptitude", scorePercent: 80 },
    { section: "Reasoning", scorePercent: 75 },
    { section: "Coding", scorePercent: 78 },
  ],
};
