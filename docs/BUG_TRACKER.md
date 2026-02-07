# FlexRun - Bug Tracker Template

**Version**: 1.0  
**Last Updated**: February 6, 2026

---

## Bug Report Format

### Template

```markdown
## BUG-[ID]: [Short Title]

**Severity**: [P0/P1/P2/P3]  
**Status**: [Open/In Progress/Fixed/Verified/Closed]  
**Found In**: [Version/Sprint]  
**Fixed In**: [Version/Sprint]  
**Reporter**: [Name]  
**Assignee**: [Name]  

### Description
[Clear description of the bug]

### Steps to Reproduce
1. [First step]
2. [Second step]
3. [...]

### Expected Behavior
[What should happen]

### Actual Behavior
[What actually happens]

### Environment
- Device: [e.g., Pixel 7]
- Android Version: [e.g., 14]
- App Version: [e.g., 1.0.0-alpha1]

### Screenshots/Logs
[Attach relevant screenshots or logs]

### Root Cause
[After investigation - what caused the bug]

### Fix Applied
[After fixing - what was done to fix it]
```

---

## Severity Definitions

| Severity | Description | Response Time | Fix Time |
|----------|-------------|---------------|----------|
| **P0** | Critical - App crash, data loss, blocking user flow | Immediate | Same sprint |
| **P1** | Major - Feature broken, significant UX issue | 1 day | Same sprint |
| **P2** | Minor - Feature works but has issues | 3 days | Next sprint |
| **P3** | Cosmetic - Visual glitch, minor annoyance | Best effort | Backlog |

---

## Active Bugs

### P0 - Critical

*No critical bugs currently*

---

### P1 - Major

*No major bugs currently*

---

### P2 - Minor

*No minor bugs currently*

---

### P3 - Cosmetic

*No cosmetic bugs currently*

---

## Bug Log

| ID | Title | Severity | Status | Found | Fixed | Sprint |
|----|-------|----------|--------|-------|-------|--------|
| - | - | - | - | - | - | - |

---

## Common Bug Categories

### GPS/Location Issues
- Signal loss handling
- Accuracy problems
- Battery drain
- Background tracking stop

### AI/API Issues
- Response timeout
- Invalid JSON parsing
- Rate limiting
- Network offline

### UI/UX Issues
- Layout breaks
- Animations glitch
- Dark mode problems
- Font scaling

### Data/Storage Issues
- Run not saved
- History not loading
- Profile reset
- Data corruption

### Voice Coaching Issues
- TTS not speaking
- Wrong timing
- Audio conflict
- Volume issues

---

## Bug Metrics

### Current Sprint

| Metric | Value |
|--------|-------|
| Bugs Opened | 0 |
| Bugs Closed | 0 |
| Bug Escape Rate | 0% |
| Avg Fix Time | N/A |

### Historical

| Sprint | Opened | Closed | Net |
|--------|--------|--------|-----|
| - | - | - | - |

---

## Test Coverage Gaps

Areas that need more testing to prevent bugs:

1. **Background location tracking** - Edge cases when app killed
2. **Long run sessions** - Memory usage over 3+ hours
3. **Poor network conditions** - API timeout handling
4. **Device rotation** - State preservation
5. **Process death** - Session recovery

---

**Document End**
