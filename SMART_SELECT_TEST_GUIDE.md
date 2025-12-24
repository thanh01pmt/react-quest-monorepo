# Smart Select - Testing Guide

## 1. Setup
- Open Map Builder.
- Generate a map (e.g., Simple Maze) or place some connected blocks manually.
- Switch to **Manual** tab.

## 2. Activate Smart Select
- Press `V` to switch to **Navigate/Select Mode**.
- Look at the sidebar (Manual Palette).
- You should see "Selection Type" toggle.
- Click **"🎯 Smart"** (or press `S`).

## 3. Test Hover Preview
- Move mouse over a ground tile.
- **Expected:** All connected ground tiles should light up with a yellow transparent overlay.
- Move mouse over an item (e.g., wall or gem).
- **Expected:** Only connected walls/items should light up (due to layer filtering).

## 4. Test Selection
- Click on the highlighted group.
- **Expected:** All highlighted tiles turn selected (orange overlay + selection box).
- Check the "Properties" panel (Right side) - it should show "Multiple Objects Selected".

## 5. Test Keyboard Shortcuts
- Press `Esc` to clear selection.
- Press `S` to toggle Smart Select mode.
- Verify the UI toggle updates.

## 6. Test Layer Filtering
- Switch **Active Layer** to "Ground" (Top center toolbar).
- Hover over ground -> Should highlight.
- Hover over walls -> Should NOT highlight.
- Switch **Active Layer** to "Items".
- Hover over ground -> Should NOT highlight.
- Hover over walls -> Should highlight.

## Troubleshooting
- If hover doesn't work: Ensure you are in "Navigate" mode (finger icon).
- If click doesn't work: Ensure no other tool is blocking (e.g., build mode).
