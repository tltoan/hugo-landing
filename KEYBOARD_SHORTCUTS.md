# Hugo LBO Modeler - Keyboard Shortcuts Guide

## Excel-Like Keyboard Shortcuts for LBO Modeling

The Hugo LBO Modeler provides comprehensive Excel-like keyboard shortcuts to enhance your modeling experience. These shortcuts are designed to mirror Excel's functionality for a familiar and efficient workflow.

## 📋 Copy & Paste Operations

| Shortcut | Action | Description |
|----------|--------|-------------|
| **Ctrl+C** | Copy | Copy selected cell's value and formula |
| **Ctrl+V** | Paste | Paste copied content to selected cell(s) |
| **Ctrl+X** | Cut | Cut selected cell's content |

## 🔄 Fill Operations

| Shortcut | Action | Description |
|----------|--------|-------------|
| **Ctrl+R** | Fill Right | Fill formula to the right, adjusting cell references |
| **Ctrl+D** | Fill Down | Fill formula downward, adjusting cell references |
| **Mouse Drag** | Drag Fill | Click and drag cell corner to fill range (auto-validates) |

## 🧭 Navigation

| Shortcut | Action | Description |
|----------|--------|-------------|
| **Arrow Keys** | Move | Navigate between cells |
| **Tab** | Next Cell | Move to next cell (right, then wrap to next row) |
| **Shift+Tab** | Previous Cell | Move to previous cell (left, then wrap to previous row) |
| **Enter** | Submit & Move Down | Submit current cell and move down |
| **Shift+Enter** | Submit & Move Up | Submit current cell and move up |

## 🎯 Selection

| Shortcut | Action | Description |
|----------|--------|-------------|
| **Shift+Arrow** | Select Range | Extend selection in arrow direction |
| **Ctrl+Tab** | Extend Right | Extend selection to the right |
| **Ctrl+Shift+Tab** | Extend Left | Extend selection to the left |
| **Click & Drag** | Mouse Selection | Select range of cells with mouse |

## 🗑️ Deletion

| Shortcut | Action | Description |
|----------|--------|-------------|
| **Delete** | Clear Cell(s) | Clear selected cell(s) content |
| **Backspace** | Clear Cell(s) | Clear selected cell(s) content |

*Note: When multiple cells are selected, Delete/Backspace will clear all selected cells at once*

## ↩️ Undo/Redo

| Shortcut | Action | Description |
|----------|--------|-------------|
| **Ctrl+Z** | Undo | Undo last action |
| **Ctrl+Y** | Redo | Redo undone action |

## 👁️ View Options

| Shortcut | Action | Description |
|----------|--------|-------------|
| **Space Bar** (hold) | Show Assumptions | Display problem assumptions overlay |
| **?** | Show Help | Display keyboard shortcuts modal |
| **Escape** | Close | Close any open dialogs or modals |

## 🖱️ Mouse Actions

| Action | Description |
|--------|-------------|
| **Click Cell** | Select and edit cell |
| **Double Click** | Edit cell formula directly |
| **Right Click** | Context menu (copy/paste options) |
| **Drag Corner** | Fill range with formula (with auto-adjustment) |
| **Click During Formula** | Insert clicked cell reference into formula |

## 📝 Formula Editing

### Special Behaviors
- Start with **=** to create a formula
- Click cells while editing formula to insert their references
- Cell references auto-adjust when filling (e.g., B2 → C2 when filling right)
- Formulas support basic math operations: +, -, *, /, ^, %
- Parentheses for operation order

### Formula Examples
- `=B4*1.25` - Multiply cell B4 by 1.25
- `=C5+C6` - Add cells C5 and C6
- `=(D7-D8)/D7` - Calculate percentage change
- `=B2*(1+B3)` - Growth calculation

## ✅ Validation & Scoring

- **Green cells** indicate correct answers
- **Automatic validation** when dragging to fill
- **Points awarded**:
  - 100 points for manually entering correct formula
  - 50 points for correct drag-filled cells
  - 75 bonus points for using drag fill feature

## 💡 Pro Tips

1. **Quick Formula Copy**: Select source cell, Ctrl+C, select range, Ctrl+V
2. **Rapid Fill**: Enter formula in first cell, select range including formula cell, Ctrl+R or Ctrl+D
3. **Multi-cell Clear**: Shift+Arrow to select range, then Delete
4. **Formula Building**: Type = then click cells to build formulas visually
5. **Undo Mistakes**: Ctrl+Z works for all operations including fills and deletes

## 🎮 Practice Mode Features

- Real-time formula validation
- Hint system for stuck cells (appears after attempts)
- Score tracking for competitive practice
- Timer to track completion speed
- Multiple problem sets with varying difficulty

## 📱 Browser Compatibility

All shortcuts work in modern browsers:
- Chrome (recommended)
- Firefox
- Safari
- Edge

*Note: On Mac, use Cmd instead of Ctrl for keyboard shortcuts*

---

Last Updated: December 2024