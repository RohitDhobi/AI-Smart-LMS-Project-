#!/bin/bash
# Auto-push script: watches for file changes and pushes to GitHub automatically
# Usage: bash scripts/auto-push.sh

echo "🚀 Auto-push started. Watching for changes..."
echo "   Press Ctrl+C to stop."
echo ""

while true; do
    # Check if there are any changes
    CURRENT_STATE=$(git status --porcelain 2>/dev/null)

    if [ -n "$CURRENT_STATE" ]; then
        TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
        echo "$TIMESTAMP 📝 Changes detected, committing and pushing..."

        # Stage everything
        git add -A

        # Count changed files
        CHANGED=$(git diff --cached --shortstat)

        # Commit with timestamp
        git commit -m "Auto-commit: $TIMESTAMP ($CHANGED)" 2>/dev/null

        # Push
        if git push 2>/dev/null; then
            echo "$TIMESTAMP ✅ Pushed successfully!"
        else
            echo "$TIMESTAMP ❌ Push failed. Will retry next time."
        fi

        echo ""
    fi

    # Wait 10 seconds before checking again
    sleep 10
done
