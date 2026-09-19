import type { PracticeLanguage } from "@/types/practice.types";

/** "Hello world" starters — same as the website compiler's language definitions. */
export const STARTER: Record<PracticeLanguage, string> = {
  java: `public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, CampusEduX!");
    }
}
`,
  javascript: `// JavaScript runs on Node.js
console.log("Hello, CampusEduX!");
`,
  python: `print("Hello, CampusEduX!")
`,
  c: `#include <stdio.h>

int main(void) {
    printf("Hello, CampusEduX!\\n");
    return 0;
}
`,
  cpp: `#include <iostream>

int main() {
    std::cout << "Hello, CampusEduX!" << std::endl;
    return 0;
}
`,
};
