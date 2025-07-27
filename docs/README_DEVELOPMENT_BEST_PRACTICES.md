# Development Best Practices & Troubleshooting

## Code Editing Guidelines

### ✅ DO: Safe Editing Practices
- Use `edit_file` for precise, targeted changes
- Make only ONE change at a time
- Test after each change (dev server or git commit)
- Use small, incremental modifications
- Read file context before editing

### ❌ DON'T: Risky Practices
- Use `search_replace` for large files or complex changes
- Make multiple changes in one operation
- Edit files without understanding the context
- Skip testing after changes

## Troubleshooting Guide

### Styling Issues (Subframe/Tailwind not working)
```bash
# 1. Restart dev server
taskkill /f /im node.exe
npm run dev

# 2. If still broken, check Tailwind config
# Ensure tailwind.config.ts has Subframe presets
```

### Destroyed Files (Wrong styling, broken components)
```bash
# Restore from git
git checkout HEAD -- src/app/settings/page.tsx

# Or restore entire project
git checkout HEAD -- .
```

### Supabase Connection Issues
```bash
# 1. Check environment variables
# 2. Verify RLS policies in Supabase dashboard
# 3. Test direct query at /test-supabase
```

## File Structure Guidelines

### Safe to Edit
- `src/app/settings/page.tsx` - Main settings page
- `src/hooks/useMaterialCategories.ts` - React hooks
- `src/lib/material-categories.ts` - API classes
- `src/types/material-categories.ts` - TypeScript types

### Handle with Care
- `tailwind.config.ts` - Critical for Subframe styling
- `src/app/layout.tsx` - Global layout
- `src/app/globals.css` - Global styles

### Don't Edit (Generated)
- `src/ui/` - Subframe generated components
- `node_modules/` - Dependencies
- `.next/` - Build cache

## Development Workflow

1. **Before making changes:**
   - Git commit current state
   - Read file context
   - Plan small, incremental changes

2. **During changes:**
   - Use `edit_file` for precision
   - Test after each change
   - Keep changes minimal

3. **After changes:**
   - Verify functionality
   - Test in browser
   - Git commit if working

## Common Issues & Solutions

### Issue: "Subframe styling disappeared"
**Solution:** Restart dev server, check Tailwind config

### Issue: "File completely broken after edit"
**Solution:** `git checkout HEAD -- filename`

### Issue: "Supabase data not showing"
**Solution:** Check RLS policies, test direct query

### Issue: "Dropdown functions not working"
**Solution:** Verify onClick handlers, check console errors

## Emergency Recovery

If everything is broken:
```bash
# 1. Stop all processes
taskkill /f /im node.exe

# 2. Restore from git
git checkout HEAD -- .

# 3. Restart dev server
npm run dev

# 4. Test functionality
# Go to http://localhost:3000/settings
```

## Remember
- **Small changes are safer than big changes**
- **Test frequently**
- **Use git as backup**
- **When in doubt, restart the dev server** 