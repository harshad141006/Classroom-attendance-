# Student Management Module

Vanilla JavaScript student registration system with localStorage persistence, real-time search, and a card-based grid layout. The implementation meets all core requirements for roll number uniqueness, CRUD operations, and persistence, with one confirmed layout defect in the card design.

**Watch for:** Card header layout violates the specification — student name is not positioned at the TOP-RIGHT corner, it's on the right side of a flex row with the roll number on the left. (confirmed)

**Verdict**: NEEDS_CHANGES

## High-level view

The card layout breaks the specification's TOP-RIGHT requirement: the header uses flexbox with `justify-content: space-between`, placing roll number on the left and name on the right at the same baseline, not at the top-right corner as specified. The student name should be positioned absolutely at the top-right of the card, with the roll number in small text at a different position.

CRUD operations are complete: add creates new students, edit pre-populates the form and changes the submit button to "Update Student", delete shows a confirmation dialog with student details, and search filters in real time against both roll number and name.

Uniqueness validation checks for duplicate roll numbers case-insensitively, skipping the currently-edited student during update. The error message "Roll Number already exists" displays above the form buttons when duplication is detected.

Persistence uses localStorage with key `"students"`, saving on every add/edit/delete and loading during initialization. The data survives page reload.

## Details

<details>
<summary>Issues (1)</summary>

1. **Card header layout breaks TOP-RIGHT requirement** — The `.student-card-header` uses `display: flex` with `justify-content: space-between`, placing the student name on the right side of the flex row, not at the top-right corner of the card. Reposition the student name to the absolute top-right corner of the card (not the header row), using absolute positioning: `.student-name-top { position: absolute; top: 20px; right: 20px; }` and `.student-card { position: relative; }`. Remove the flex layout from the header entirely or use it only for the small roll number if needed.

</details>

### Card layout defect

The specification requires student name in small text at the TOP-RIGHT corner of the card. The example shows:

```
┌────────────────────────┐
│ 24CS073          Harini C
│                        │
│       24CS073          │
└────────────────────────┘
```

The implementation creates a header div with flexbox:

```css
.student-card-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 20px;
}
```

This puts the roll number on the left and name on the right at the same vertical level, not at the top-right corner. The name is right-aligned within the flex container but not positioned at the card's top-right corner. The specification's ASCII diagram shows the name flush against the top-right edge of the card border.

The HTML structure places both elements inside `.student-card-header`:

```html
<div class="student-card-header">
    <span class="student-roll-small">${escapeHtml(student.rollNumber)}</span>
    <span class="student-name-top">${escapeHtml(student.name)}</span>
</div>
```

To match the specification, the name should be positioned absolutely at `top: 20px; right: 20px;` on the card itself (which needs `position: relative`), not inside a flex row.

### CRUD completeness

Edit pre-populates the form, changes the submit button to "Update Student", and reveals a Cancel button. The uniqueness check skips the roll number being edited (`s.rollNumber !== editingRollNumber`), allowing the roll number to remain unchanged or be updated to a different unique value.

Delete shows a confirmation dialog with student details. If the deleted student is currently being edited, `handleCancel()` resets the form state.

Search filters in real time (case-insensitive) against both roll number and name, with distinct messages for "no students" vs "no matches".

### Persistence and uniqueness

Persistence uses localStorage key `"students"`, saving on every add/edit/delete and loading during initialization with fallback to an empty array on parse failure.

Uniqueness validation compares the submitted roll number (trimmed and lowercased) against existing students: `students.find(s => s.rollNumber.toLowerCase() === rollNumber.toLowerCase() && s.rollNumber !== editingRollNumber)`. The second condition skips the student being edited, preventing false positives during updates. When a duplicate is found, the error message "Roll Number already exists. Please use a unique Roll Number." displays above the form buttons and the submission is blocked.

### Responsive grid and XSS protection

The student grid uses CSS Grid with `grid-template-columns: repeat(auto-fill, minmax(280px, 1fr))`, adapting the column count to viewport width. Media queries reduce the minimum card width to 240px below 768px and switch to a single column below 480px.

The `escapeHtml()` function prevents XSS by setting `textContent` on a temporary div and returning the escaped `innerHTML`. Applied to all dynamic content in `renderStudents()` and inline `onclick` attributes.

### Not tested

The implementation has no automated tests. The following edge cases were not systematically tested:

- Roll number uniqueness with leading/trailing whitespace
- Case sensitivity of roll number uniqueness
- Editing a student to a roll number that conflicts with another student
- Deleting a student that's currently being edited
- localStorage quota exhaustion or corruption
- Malformed JSON in localStorage
- Very long roll numbers or names that overflow the card layout
- Special characters and Unicode in names

</details>

## File map

<details>
<summary>Files changed</summary>

- `index.html` — page structure with registration form, search input, and student grid container
- `app.js` — CRUD logic, localStorage persistence, search filtering, and form state management
- `styles.css` — gradient background, card grid layout, responsive breakpoints, and button styles

</details>
