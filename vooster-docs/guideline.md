# AI 기반 동행 기도 PWA - Code Guidelines

## 1. Project Overview

This project is a PWA designed to provide AI-generated personalized prayers, TTS functionality, and a real-time concurrent user count to foster a sense of community among Christian users. The core technology stack includes Next.js, TypeScript, Tailwind CSS, Supabase, OpenAI GPT-3.5, and Naver Clova Speech TTS. The architecture follows a domain-driven approach with separation of concerns into distinct layers.

## 2. Core Principles

-   **Maintainability:** Code should be easy to understand, modify, and extend.
-   **Readability:** Code should be clear, concise, and well-documented.
-   **Testability:** Code should be designed to facilitate unit and integration testing.
-   **Performance:** Code should be optimized for speed and efficiency.
-   **Security:** Code should be written to prevent common security vulnerabilities.

## 3. Language-Specific Guidelines

### TypeScript

*   **File Organization and Directory Structure:** Adhere to the Domain-Driven Organization Strategy defined in the TRD.
    *   Group files by feature or domain.
    *   Use a consistent naming convention (e.g., `prayerService.ts`, `PrayerCard.tsx`).
*   **Import/Dependency Management:**
    *   Use absolute imports for internal modules (e.g., `import PrayerCard from 'components/PrayerCard';`).
    *   Install dependencies using `npm` or `yarn` and manage them in `package.json`.
    *   Avoid circular dependencies.
*   **Error Handling Patterns:**
    *   Use `try...catch` blocks for handling potential exceptions.
    *   Implement centralized error logging and reporting.
    *   Create custom error classes for specific domain errors.

### Next.js

*   **File Organization:** Follow the standard Next.js directory structure (e.g., `pages`, `components`, `public`, `styles`).
*   **API Routes:** Place API route handlers in the `pages/api` directory.
*   **Data Fetching:** Use `getServerSideProps` for server-side rendering and `getStaticProps` for static site generation.
*   **Linking:** Use the `<Link>` component for internal navigation.

### Tailwind CSS

*   **Class Naming:** Use descriptive and consistent class names.
*   **Customization:** Customize Tailwind CSS using `tailwind.config.js`.
*   **Responsive Design:** Utilize Tailwind's responsive modifiers (e.g., `md:`, `lg:`) for different screen sizes.
*   **Component Extraction:** Extract common styling patterns into reusable components.

### Supabase

*   **Client Initialization:** Initialize the Supabase client in a dedicated module (e.g., `supabaseClient.ts`).
*   **Data Fetching:** Use the Supabase client to perform CRUD operations on the PostgreSQL database.
*   **Realtime Updates:** Use Supabase Realtime for broadcasting real-time data.
*   **Edge Functions:** Use Supabase Edge Functions for custom backend logic.

### OpenAI GPT-3.5 & Naver Clova Speech TTS

*   **API Integration:** Create dedicated services for interacting with the OpenAI and Naver Clova APIs (e.g., `prayerService.ts`, `ttsService.ts`).
*   **Error Handling:** Implement robust error handling for API calls.
*   **Caching:** Implement caching strategies to reduce API calls and improve response times.
*   **Rate Limiting:** Implement rate limiting to prevent abuse of the APIs.

## 4. Code Style Rules

#### MUST Follow:

*   **Use TypeScript:** All code MUST be written in TypeScript to ensure type safety and maintainability.
    *   Rationale: TypeScript provides static typing, which helps catch errors early in the development process and improves code readability.
    *   Implementation: Enforce TypeScript usage through project configuration and code review.
*   **Follow a Consistent Code Style:** Code MUST adhere to a consistent code style, enforced by ESLint and Prettier.
    *   Rationale: Consistent code style improves readability and maintainability.
    *   Implementation: Configure ESLint and Prettier with appropriate rules and integrate them into the development workflow.
*   **Write Unit Tests:** Unit tests MUST be written for all core logic and components.
    *   Rationale: Unit tests ensure that code functions as expected and prevent regressions.
    *   Implementation: Use Jest or a similar testing framework and aim for high test coverage.
*   **Use Meaningful Names:** Variables, functions, and classes MUST have meaningful names that clearly indicate their purpose.
    *   Rationale: Meaningful names improve code readability and understanding.
    *   Implementation: Follow a consistent naming convention and avoid abbreviations or acronyms.
*   **Document Code:** Code MUST be documented using JSDoc-style comments.
    *   Rationale: Documentation helps explain the purpose and usage of code.
    *   Implementation: Document all functions, classes, and interfaces with clear and concise comments.
*   **Handle Errors Properly:** All potential errors MUST be handled gracefully using `try...catch` blocks or similar mechanisms.
    *   Rationale: Proper error handling prevents unexpected crashes and provides a better user experience.
    *   Implementation: Log errors and display informative messages to the user.
*   **Use Environment Variables:** Sensitive information such as API keys and database credentials MUST be stored in environment variables.
    *   Rationale: Environment variables prevent sensitive information from being exposed in the codebase.
    *   Implementation: Use a library such as `dotenv` to load environment variables from a `.env` file.
*   **Keep Components Small and Focused:** React components MUST have a single responsibility and be as small as possible.
    *   Rationale: Small, focused components are easier to understand, test, and reuse.
    *   Implementation: Break down large components into smaller, more manageable pieces.
*   **Use Functional Components with Hooks:**  Favor functional components with hooks over class components.
    *   Rationale: Functional components with hooks are more concise and easier to test.
    *   Implementation: Use `useState`, `useEffect`, and other hooks to manage state and side effects.
*   **Optimize Performance:** Code MUST be optimized for performance to ensure a smooth user experience.
    *   Rationale: Performance optimization reduces load times and improves responsiveness.
    *   Implementation: Use techniques such as code splitting, caching, and image optimization.

#### MUST NOT Do:

*   **Commit Sensitive Information:** API keys, database passwords, and other sensitive information MUST NOT be committed to the repository.
    *   Rationale: Committing sensitive information can lead to security breaches.
    *   Implementation: Use environment variables and `.gitignore` to prevent sensitive information from being committed.
*   **Ignore Errors:** Errors MUST NOT be ignored or suppressed without proper handling.
    *   Rationale: Ignoring errors can lead to unexpected behavior and make it difficult to debug issues.
    *   Implementation: Log errors and display informative messages to the user.
*   **Write Complex Components:** AVOID writing complex, multi-responsibility module in single file.
    *   Rationale: Complex modules are hard to test and maintain.
    *   Implementation: Break down complex modules into smaller, more manageable modules.
*   **Implement Complex State Management:** AVOID defining complex state management pattern unless absolutely necessary. Favor simpler solutions like `useState` or `useReducer` where appropriate.
    *   Rationale: Overly complex state management can increase the complexity of the codebase.
    *   Implementation: Evaluate state management needs carefully before choosing a solution.
*   **Use `any` Type:** AVOID using `any` type in Typescript, except when absolutely necessary and with a clear justification.
    *   Rationale: Using `any` defeats the purpose of Typescript's type system.
    *   Implementation: Strive to provide specific types for all variables and function parameters.
*   **Mutate State Directly:**  MUST NOT mutate state directly in React components.
    *   Rationale: Direct state mutation can lead to unexpected behavior and performance issues.
    *   Implementation: Use the `setState` method or the `useState` hook to update state.
*   **Use Inline Styles:** AVOID using inline styles in React components.
    *   Rationale: Inline styles are difficult to maintain and can lead to code duplication.
    *   Implementation: Use CSS classes or a styling library such as Tailwind CSS.
*   **Introduce Technical Debt Unnecessarily:** Technical debt MUST NOT be introduced without a clear plan for addressing it.
    *   Rationale: Technical debt can lead to increased development costs and reduced code quality.
    *   Implementation: Prioritize code quality and refactor code regularly.

## 5. Architecture Patterns

*   **Component/module structure guidelines:**
    *   Follow the Domain-Driven Organization Strategy.
    *   Separate components into presentational and container components.
    *   Use a consistent naming convention for components and modules.
*   **Data flow patterns:**
    *   Use unidirectional data flow.
    *   Pass data down from parent components to child components.
    *   Use callbacks to communicate events from child components to parent components.
*   **State management conventions:**
    *   Use React Context API for global state.
    *   Use Redux or similar library for complex state management scenarios.
    *   Favor simpler solutions like `useState` or `useReducer` where appropriate.
*   **API design standards:**
    *   Use RESTful API conventions.
    *   Use JSON for data exchange.
    *   Implement authentication and authorization.
    *   Handle errors gracefully.

## Example Code Snippets

```typescript
// MUST: Example of a well-documented function
/**
 * Generates a personalized prayer using OpenAI GPT-3.5.
 * @param topic The topic of the prayer.
 * @returns A promise that resolves to the generated prayer text.
 */
async function generatePrayer(topic: string): Promise<string> {
  // Implementation details
  return "Generated Prayer";
}
// Explanation: This function is well-documented with JSDoc-style comments,
// making it easy to understand its purpose and usage.
```

```typescript
// MUST NOT: Example of using 'any' type
function processData(data: any): void {
  // Avoid using 'any' - specify the expected type instead
  console.log(data.name); // Potential runtime error if 'data' doesn't have a 'name' property
}
// Explanation: Using 'any' defeats the purpose of TypeScript and can lead to runtime errors.
// Fix: Define an interface or type for the expected data structure.
```

```typescript
// MUST: Example of a functional component with hooks
import React, { useState } from 'react';

function Counter() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>Increment</button>
    </div>
  );
}
// Explanation: This component uses the useState hook to manage state,
// making it concise and easy to understand.
```

```typescript
// MUST NOT: Example of direct state mutation
function updateObject(obj: {name: string}) {
  obj.name = "New Name"; // Direct state mutation is bad
  // ...
}

// Correct way:
function updateObjectCorrectly(obj: {name: string}) {
  return {...obj, name: "New Name"}; // Create new object
}
// Explanation: Mutating state directly can cause unexpected behavior.
// Always create new objects or arrays when updating state.
```

```typescript
// MUST: Example of using environment variables
const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
  console.error('OPENAI_API_KEY is not set in environment variables.');
}
// Explanation: API keys and other sensitive information should be stored in environment variables
// and accessed using process.env. This prevents them from being committed to the repository.
```

```typescript
// MUST: Example of using try...catch for error handling
async function fetchData() {
  try {
    const response = await fetch('/api/data');
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching data:', error);
    // Handle the error appropriately, e.g., display an error message to the user
    return null;
  }
}
// Explanation: Wrapping asynchronous operations in try...catch blocks allows you to handle potential errors gracefully.
```
