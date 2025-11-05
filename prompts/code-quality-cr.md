We made a load of changes to our code.

Please do a thorough code review:
1. Evaluate code quality:
    - Functions should be short and perform a single well defined and granular task
    - Good seperation of concerns between functions
    - Good seperation of concerns between files
    - No WET code and code repetitions
    - Code is easy to understand for other devs
2. Look for any obvious bugs or issues in the code.
3. Look for subtle data alignment issues (e.g. expecting snake_case but getting camelCase or expecting data to come through in an object but receiving a nested object like {data:{}})
4. Look for any over-engineering or files getting too large and needing refactoring
5. Look for any weird syntax or style that doesn't match other parts of the codebase

Document your findings in docs/quality-review/<N>_REVIEW.md with the next available feature number (starting with 0001) unless a different file name is specified.
Don't apply your recomendations yet, just document them.