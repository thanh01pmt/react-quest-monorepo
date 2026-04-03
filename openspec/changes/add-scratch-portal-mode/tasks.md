# Task: Add Scratch Portal Mode

## 1. Core Component Development [COMPLETED]
- [x] 1.1 Create `ScratchQuestPanel` directory and base component
- [x] 1.2 Implement internal tab state (Instructions, Upload, Problem)
- [x] 1.3 Develop `InstructionsView` with multi-language support
- [x] 1.4 Develop `ProblemView` to display quest description and title
- [x] 1.5 Develop `UploadView` with drag-and-drop `.sb3` support
- [x] 1.6 Integrate `SupabaseContestService.submitSb3File` for project submission
- [x] 1.7 Add basic validation for file types and sizes
- [x] 1.8 Implement premium styling and layout for the panel

## 2. Contest Integration (ExamRoom) [COMPLETED]
- [x] 2.1 Modify `ExamRoom.tsx` to detect `scratch` game type
- [x] 2.2 Implement conditional rendering to swap `QuestPlayer` with `ScratchQuestPanel`
- [x] 2.3 Ensure persistent student state (loading previous uploads if available)
- [x] 2.4 Verify telemetry and completion tracking still functions

## 3. Scratch Guest / Standalone Mode [COMPLETED]
- [x] 3.1 Update `App.tsx` routes/logic to support Scratch quests in guest mode
- [x] 3.2 Implement a standalone upload handler for non-contest sessions
- [x] 3.3 Test with custom Scratch quest JSON (e.g., `test-scratch.json`)
- [x] 3.4 Ensure the "Problem" tab renders correctly for standalone quests

## 4. Leaderboard & Polish [COMPLETED]
- [x] 4.1 Create `LeaderboardPage.tsx` and `LeaderboardPage.css`
- [x] 4.2 Implement real-time leaderboard fetching (every 15s)
- [x] 4.3 Add public viewing capability for contest results
- [x] 4.4 Link Scratch portal success state to the leaderboard
- [x] 4.5 Final UI/UX sweep: responsiveness, Inter font, and dark mode compliance
- [x] 4.6 Create `walkthrough.md` for team review
