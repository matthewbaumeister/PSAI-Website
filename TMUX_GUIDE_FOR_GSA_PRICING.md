# tmux Guide for GSA Pricing Collection

## What is tmux?

tmux lets you run commands in the background so you can:
- Close your terminal window without stopping the process
- Disconnect from SSH without killing the job
- Reconnect later to check progress

## Quick Start (Copy/Paste This)

### 1. Start a new tmux session

```bash
cd /Users/matthewbaumeister/Documents/PropShop_AI_Website
tmux new-session -s gsa-pricing
```

You'll see a green bar at the bottom - you're now inside tmux!

### 2. Set environment variables (inside tmux)

```bash
export NEXT_PUBLIC_SUPABASE_URL="https://reprsoqodhmpdoiajhst.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJlcHJzb3FvZGhtcGRvaWFqaHN0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTUxNjU0OCwiZXhwIjoyMDcxMDkyNTQ4fQ.J7bBpqSN4uL4D_Wp4e4pRPdOzGrbgBb0Uyia1fGdq1o"
```

### 3. Run the script

```bash
./scripts/run-complete-gsa-pricing-collection.sh
```

When prompted:
- **Test mode?** Type `y` then Enter (for 10 files)
- **Production?** Type `n` then Enter (for all ~3,000 files)

### 4. Detach from tmux (leave it running)

Press: **Ctrl+B**, then **D** (that's two separate key presses)

You'll see: `[detached (from session gsa-pricing)]`

The script is still running in the background!

### 5. Reattach later to check progress

```bash
tmux attach -t gsa-pricing
```

Or shorter:
```bash
tmux a -t gsa-pricing
```

### 6. When finished, close the session

Inside tmux, type:
```bash
exit
```

## Common tmux Commands

| Command | What it does |
|---------|-------------|
| `tmux new -s NAME` | Create new session |
| `tmux ls` | List all sessions |
| `tmux a -t NAME` | Attach to session |
| `Ctrl+B, D` | Detach (leave running) |
| `Ctrl+B, [` | Scroll mode (q to quit) |
| `exit` | Close session |

## Complete Example Session

```bash
# 1. Start tmux
cd /Users/matthewbaumeister/Documents/PropShop_AI_Website
tmux new-session -s gsa-pricing

# 2. Set credentials
export NEXT_PUBLIC_SUPABASE_URL="https://reprsoqodhmpdoiajhst.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="your_key_here"

# 3. Test mode first (recommended)
./scripts/run-complete-gsa-pricing-collection.sh
# Answer: y (for test mode)

# Wait ~5 minutes, verify it works

# 4. Then run production mode
./scripts/run-complete-gsa-pricing-collection.sh
# Answer: n (for production mode)

# 5. Detach and let it run
# Press: Ctrl+B, then D

# 6. Come back later to check
tmux attach -t gsa-pricing

# 7. View scrollback
# Press: Ctrl+B, then [
# Use arrow keys or Page Up/Down to scroll
# Press 'q' to quit scroll mode

# 8. When done
exit
```

## Test Mode First (Recommended)

Always test with 10 files first:

```bash
tmux new-session -s gsa-pricing-test
export NEXT_PUBLIC_SUPABASE_URL="..."
export SUPABASE_SERVICE_ROLE_KEY="..."
./scripts/run-complete-gsa-pricing-collection.sh
# Answer: y
```

Wait ~5 minutes, verify it works, then run production:

```bash
tmux new-session -s gsa-pricing-prod
export NEXT_PUBLIC_SUPABASE_URL="..."
export SUPABASE_SERVICE_ROLE_KEY="..."
./scripts/run-complete-gsa-pricing-collection.sh
# Answer: n
```

## Scrolling in tmux

To see earlier output:
1. Press: **Ctrl+B**, then **[**
2. Use arrow keys or Page Up/Down to scroll
3. Press **q** to exit scroll mode

## Multiple tmux Sessions

You can run multiple sessions:

```bash
tmux ls                           # List all sessions
tmux new -s session1              # Create session1
tmux new -s session2              # Create session2
tmux a -t session1                # Attach to session1
tmux kill-session -t session1     # Kill session1
```

## Troubleshooting

**"session not found"**
→ Check active sessions: `tmux ls`

**Can't scroll up**
→ Enter scroll mode first: `Ctrl+B` then `[`

**Accidentally closed terminal**
→ No problem! Reconnect: `tmux a -t gsa-pricing`

**Want to cancel the script**
→ Attach to session, then press `Ctrl+C`

## Pro Tips

1. **Always test first**: Run with 10 files before full production
2. **Check logs**: Use scroll mode to review earlier output
3. **Multiple windows**: `Ctrl+B` then `c` creates new window
4. **Switch windows**: `Ctrl+B` then `0`, `1`, `2`, etc.
5. **Rename session**: `tmux rename-session -t old-name new-name`

## Quick Reference Card

```
START:     tmux new -s gsa-pricing
DETACH:    Ctrl+B, D
REATTACH:  tmux a -t gsa-pricing
SCROLL:    Ctrl+B, [  (q to exit)
EXIT:      exit
LIST:      tmux ls
```

## Common Workflow

```bash
# Morning: Start the job
tmux new -s gsa-pricing
./scripts/run-complete-gsa-pricing-collection.sh
# Press Ctrl+B, D to detach

# Afternoon: Check progress
tmux a -t gsa-pricing
# Look at logs
# Press Ctrl+B, D to detach again

# Evening: Check if done
tmux a -t gsa-pricing
# If complete, verify data
# exit
```

That's it! tmux keeps your long-running jobs safe.

