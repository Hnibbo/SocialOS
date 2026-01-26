# SocialOS Task Progress - AI Agent Instructions

## Purpose
This folder contains task tracking files for all AI agents working on SocialOS. The goal is to transform SocialOS into a fully complete, functional, market-dominating application.

## Available Tools
- Vercel CLI - Already setup and linked
- Supabase CLI - Already setup and linked
- No npx prefix needed for CLI commands

## Current Status
The application is far from complete. Critical issues include:
- Broken imports causing errors (User, MessageSquare, CardHeader, Badge not defined) - IN PROGRESS
- Missing database tables (platform_settings, security_rules, etc.) - IN PROGRESS
- Permission errors on database operations
- Duplicate navigation bars in admin panel
- Non-functional UI elements throughout
- Poor overall design and UX
- Many pages have things that does nothing
- Our features are not fully built

## Priority Levels
1. **CRITICAL** - Application-breaking bugs, must fix immediately
2. **HIGH** - Major functionality issues, affects user experience
3. **MEDIUM** - Important features not working, app still usable
4. **LOW** - Nice-to-have improvements and enhancements

## Agent Workflow

### 1. Before Starting Work
- Read all files in this folder
- Check current state of application
- Identify tasks matching your capabilities
- Claim tasks by marking them with your name
- Update task status appropriately

### 2. Working on Tasks
- Test changes thoroughly before considering complete
- Update task files as you progress
- Mark tasks as IN_PROGRESS when started
- Document any blockers or dependencies found
- Add new tasks discovered during work

### 3. Completing Tasks
- Mark tasks as COMPLETED with date
- Document what was done
- Test the feature thoroughly
- Update any related tasks

### 4. Adding New Tasks
- Add to appropriate file (ideas, in-progress, etc.)
- Include clear description and requirements
- Note dependencies if any
- Suggest priority level

## File Descriptions

### ideas-to-add.md
New feature ideas, enhancements, and future roadmap items. Add anything that would make SocialOS better.

### in-progress.md
Currently active tasks. If you start work, add your task here. Mark with your name and start date.

### needed.md
Essential missing functionality. These are blocking features that the app needs to be considered complete.

### could-be-better.md
Things that work but could be improved. Performance, UX, code quality, etc.

### incomplete.md
Features that exist but aren't fully implemented or have missing functionality.

### critical-bugs.md
Application-breaking bugs and errors. These take highest priority.

### ui-design-improvements.md
UI/UX issues, design problems, and visual improvements needed.

## Development Guidelines

### Code Quality
- Follow existing code patterns and conventions
- Write clean, maintainable code
- Add comments for complex logic
- Ensure proper error handling
- Test thoroughly before marking complete

### Database Operations
- Always check if tables exist before querying
- Handle permission errors gracefully
- Use proper TypeScript types
- Consider caching for frequently accessed data

### UI/UX
- Ensure responsive design
- Test on different screen sizes
- Provide loading states for async operations
- Add proper error messages for users
- Make interactions feel instant and smooth

### Security
- Never expose sensitive data
- Validate all user inputs
- Implement proper authentication checks
- Use prepared statements for database queries
- Handle errors without exposing internals

## Deployment Commands

### Vercel
```bash
vercel --prod
vercel deploy
vercel logs
```

### Supabase
```bash
supabase db push
supabase functions deploy
supabase gen types typescript
supabase status
```

## Testing Checklist
Before marking any task complete, ensure:
- [ ] No console errors
- [ ] Works on desktop (1920x1080)
- [ ] Works on tablet (768x1024)
- [ ] Works on mobile (375x667)
- [ ] All buttons/functions work
- [ ] Loading states appear
- [ ] Error messages are clear
- [ ] No TypeScript errors
- [ ] Database queries work properly
- [ ] Permissions are correct

## Communication
- Be specific about what you're working on
- Document any assumptions made
- Ask if you encounter blockers
- Share insights that could help others
- Update files promptly after completing work

## Success Metrics
We'll know SocialOS is complete when:
1. All critical bugs are fixed
2. All pages load without errors
3. All features are fully functional
4. UI/UX is professional and polished
5. Admin panel works perfectly
6. No duplicate navigation elements
7. All database operations work
8. Performance is excellent
9. Mobile experience is native-like
10. Users would be excited to use it

---

**Remember:** Every improvement counts. Work systematically, test thoroughly, and document everything. We're building the best social operating system possible.

**Last Updated:** 2026-01-16
**Status:** Active Development - Critical Issues Need Immediate Attention
