---
description: Manage and display parallel Claude sessions
---

Manage and display information about parallel Claude sessions.

## Show Session Status

Display all active parallel sessions:

```bash
node .claude/hooks/multi-session.cjs --status
```

## Session Management Best Practices

Based on Boris Cherny's workflow:

### Terminal Sessions (Local)
- Number your terminal tabs 1-5
- Use system notifications to know when Claude needs input
- Run different agents in different tabs:
  - Tab 1: Conductor (planning/coordination)
  - Tab 2: Architect (design/architecture)
  - Tab 3: Builder (implementation)
  - Tab 4: Reviewer (code review)
  - Tab 5: Explorer (research)

### Web Sessions (claude.ai/code)
- Run 5-10 web sessions in parallel with local sessions
- Use `&` to hand off local sessions to web
- Use `--teleport` to switch between local and web
- Start sessions from mobile Claude app for async work

### Session Handoff

To hand off a session to web:
```bash
# End local session with summary
# The session context will be available in claude.ai/code
```

## View Session History

```bash
cat .claude/sessions/active-sessions.json
```

## Clean Old Sessions

Sessions older than 1 hour are automatically cleaned up. To manually clean:

```bash
rm .claude/sessions/active-sessions.json
```

## Tips

1. **Use Plan mode** (Shift+Tab twice) for most sessions
2. **Switch to auto-accept** after approving a plan
3. **Let sessions run in parallel** - don't wait for one to finish
4. **Check notifications** to see when sessions need input
