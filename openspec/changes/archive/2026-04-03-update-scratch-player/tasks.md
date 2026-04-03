## 1. Preparation
- [ ] 1.1 Fix the bug in `ExamRoom/index.tsx` so `gameType === 'scratch'` correctly evaluates and renders `ScratchUploader` component.
- [ ] 1.2 Install `@turbowarp/sbdl` package inside `apps/react-quest-app`.

## 2. ScratchUploader UI Enhancements
- [ ] 2.1 Update `ScratchUploader` to feature a toggle or dual-input mode: Upload File vs Paste URL.
- [ ] 2.2 Re-architect the `ScratchUploader` logic to download `.sb3` using `@turbowarp/sbdl` when a URL is pasted, returning a `File` or `Blob` object representing the `.sb3` file.

## 3. Immediate Evaluation Logic
- [ ] 3.1 Implement a "Check" or "Analyze" feature prior to final submission. When a file is loaded, run it against public test cases. *(Assuming an API endpoint exists or will be added that accepts `.sb3` files and returns a subset of test results without saving to the DB)*.
- [ ] 3.2 Add a UI section to display passing/failing public test cases immediately inside the `ScratchUploader` workspace.

## 4. Final Submission
- [ ] 4.1 Ensure the "Submit" button properly sends the `.sb3` file (whether retrieved from URL or direct upload) to the server using the `onUpload`/`submitSb3` process, ensuring that points are officially recorded only upon this action.
