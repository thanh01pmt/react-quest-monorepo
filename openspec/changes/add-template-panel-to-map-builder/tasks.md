# Tasks: Add Template Panel to Map Builder App

## Phase 1: Core Components

### 1.1 TemplatePanel Component
- [ ] 1.1.1 Create `TemplatePanel/` directory structure
- [ ] 1.1.2 Implement `TemplatePanel.tsx` main component
- [ ] 1.1.3 Create `TemplatePanel.css` with styling
- [ ] 1.1.4 Add panel header with title and description
- [ ] 1.1.5 Add export `index.ts`

### 1.2 TemplateSelector Component
- [ ] 1.2.1 Create `TemplateSelector.tsx` dropdown component
- [ ] 1.2.2 Define preset templates array:
  - Simple Sequence
  - Simple FOR Loop (5 steps)
  - FOR Loop with Turns (L-shape)
  - Square Pattern
  - Nested FOR Loops (Grid)
  - Function Pattern
  - Custom Code (empty)
- [ ] 1.2.3 Implement `onChange` callback to populate code editor
- [ ] 1.2.4 Style dropdown to match existing UI

### 1.3 TemplateCodeEditor Component
- [ ] 1.3.1 Create basic `TemplateCodeEditor.tsx` with textarea
- [ ] 1.3.2 Add line numbers display
- [ ] 1.3.3 Implement syntax highlighting (optional - monaco or prism)
- [ ] 1.3.4 Add onChange callback for code updates
- [ ] 1.3.5 Support Ctrl+Enter shortcut to generate

### 1.4 TemplatePreview Component
- [ ] 1.4.1 Create `TemplatePreview.tsx` component
- [ ] 1.4.2 Integrate with `SolutionDrivenGenerator` to parse code
- [ ] 1.4.3 Display metrics: path length, items count, complexity
- [ ] 1.4.4 Show ASCII map preview (text-based)
- [ ] 1.4.5 Display error messages for invalid code

---

## Phase 2: App Integration

### 2.1 Tab System
- [ ] 2.1.1 Update `App.tsx` state to include `"template"` tab option
- [ ] 2.1.2 Modify `MainLeftPanel` to accept 3 tabs
- [ ] 2.1.3 Add tab button for "Template"
- [ ] 2.1.4 Render `TemplatePanel` when template tab active

### 2.2 Template to Map Conversion
- [ ] 2.2.1 Create `utils/templateConverter.ts`
- [ ] 2.2.2 Implement `convertToBuilderFormat()`:
  - `result.gameConfig.blocks` → builder blocks array
  - `result.gameConfig.collectibles` → builder items array  
  - `result.gameConfig.players` → player position
  - `result.gameConfig.finish` → finish position
- [ ] 2.2.3 Add reverse conversion (for editing generated map)

### 2.3 Generate Action
- [ ] 2.3.1 Implement "Generate Map" button handler
- [ ] 2.3.2 Call `generateFromCode()` with editor content
- [ ] 2.3.3 Convert result to builder format
- [ ] 2.3.4 Update map state (clear existing, add new)
- [ ] 2.3.5 Switch to 3D view to show result

---

## Phase 3: UX Polish

### 3.1 Error Handling
- [ ] 3.1.1 Catch parse errors from interpreter
- [ ] 3.1.2 Display error message with line number
- [ ] 3.1.3 Highlight error line in code editor

### 3.2 State Persistence
- [ ] 3.2.1 Save current template code to localStorage
- [ ] 3.2.2 Restore code on page reload
- [ ] 3.2.3 Clear code button

### 3.3 Additional Actions
- [ ] 3.3.1 "Copy JSON" button to copy GameConfig
- [ ] 3.3.2 "Download JSON" button to save file
- [ ] 3.3.3 "View Solution" to show raw actions list

### 3.4 Visual Polish
- [ ] 3.4.1 Loading state during generation
- [ ] 3.4.2 Success feedback (toast/animation)
- [ ] 3.4.3 Responsive design for smaller screens
- [ ] 3.4.4 Match existing app theme

---

## Phase 4: Testing & Documentation

### 4.1 Manual Testing
- [ ] 4.1.1 Test all preset templates generate correctly
- [ ] 4.1.2 Test custom code with various patterns
- [ ] 4.1.3 Test error handling for invalid code
- [ ] 4.1.4 Test tab switching doesn't lose state
- [ ] 4.1.5 Test generated map is editable in Topology/Placement tabs

### 4.2 Documentation
- [ ] 4.2.1 Add tooltip/help text in Template panel
- [ ] 4.2.2 Update app README with Template feature
- [ ] 4.2.3 Add example templates in documentation

---

## Estimated Effort

| Phase | Tasks | Estimated Time |
|-------|-------|----------------|
| Phase 1 | Core Components | 2-3 hours |
| Phase 2 | App Integration | 1-2 hours |
| Phase 3 | UX Polish | 1-2 hours |
| Phase 4 | Testing & Docs | 1 hour |
| **Total** | | **5-8 hours** |

## Dependencies

- `@repo/academic-map-generator` với `SolutionDrivenGenerator` (đã có)
- Không cần thêm npm packages (sử dụng textarea đơn giản trước)
