# Fix handleProgramClick Function

## Location: /App.tsx (around line 768)

## Current Code:
```typescript
const handleProgramClick = (program: any) => {
  // Will navigate to program detail page
  alert(`📋 ${program.name}\n\n${program.description}\n\n✅ You have ${program.submissions} submissions in this category.\n\n[In the full app, this will open a detail page with submission form]`);
};
```

## Replace With:
```typescript
const handleProgramClick = (program: any) => {
  setActiveTab('programs');
};
```

## Manual Steps:
1. Open `/App.tsx` in your code editor
2. Find line ~768 where `handleProgramClick` is defined
3. Delete the alert() line
4. Replace with: `setActiveTab('programs');`
5. Save the file

The function should become just 3 lines instead of the current 4 lines.
