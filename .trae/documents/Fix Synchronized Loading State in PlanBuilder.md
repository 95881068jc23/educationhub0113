I will fix the issue where multiple "Generate" buttons show the loading state simultaneously by separating the loading state for each action.

**Steps:**
1.  **Update State**: Change `loadingAI` in `src/apps/planner/components/PlanBuilder.tsx` from a `boolean` to a `string | null` to track *which* specific generation type is active (e.g., `'industry'`, `'interest'`, or `'custom'`).
2.  **Update Logic**: Modify `handleAIGenerate` to set `loadingAI` to the specific `type` string instead of `true`, and reset it to `null` instead of `false` when done.
3.  **Update UI**:
    *   Update the **Industry & Role** button to only show "Generating..." when `loadingAI === 'industry'`.
    *   Update the **Interests** button to only show "Generating..." when `loadingAI === 'interest'`.
    *   Update the **Custom Prompt** button to only show "Generating..." when `loadingAI === 'custom'`.
    *   Ensure all buttons are disabled when *any* generation is in progress (`!!loadingAI`) to prevent concurrent requests.

This ensures that clicking one button only triggers the loading indicator for that specific button, while correctly disabling the others during the process.