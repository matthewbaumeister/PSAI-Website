# AI Opportunity Chat Assistant - Feature Guide

## Overview
Users can now have conversational interactions with an AI assistant about any SBIR/STTR opportunity. The AI has access to all opportunity data and can answer questions about requirements, deadlines, funding, and more.

## For Users

### How to Access
1. **Button**: Click "Ask AI About This Opportunity" at the top of any opportunity page
2. **Keyboard Shortcut**: Press `⌘K` (Mac) or `Ctrl+K` (Windows/Linux)
3. **Close**: Press `Escape` or click "Close" button

### What You Can Ask
- "What are the submission requirements for Volume 2?"
- "When is the proposal deadline?"
- "How much funding is available for Phase 1?"
- "What technology areas does this opportunity cover?"
- "Are there any restrictions on who can apply?"
- "What questions have been asked in the Q&A?"
- "Explain the Phase 1 objectives"

### Features
- **Conversational**: Maintains context from previous messages in the session
- **Accurate**: Answers based on actual opportunity data
- **Helpful**: Cites specific sections when relevant
- **Clear**: States clearly when information isn't available

### Guest Access
Shared links (`/share/[token]`) do not have chat access. Guests will see a banner prompting them to sign in for full access to the AI assistant.

## Technical Details

### Architecture

**Frontend**: `src/components/OpportunityChat.tsx`
- Modal interface with message history
- Session-based conversation (not persisted)
- Auto-scroll, typing indicators
- Keyboard navigation

**Backend**: `src/app/api/admin/opportunity-chat/route.ts`
- Authentication required (`requireAuth`)
- Builds comprehensive opportunity context (~3,000 tokens)
- Maintains last 6 messages for conversational flow
- GPT-4o-mini for fast, cost-effective responses

### Data Context
The AI has access to:
- Basic info (topic number, title, status, component)
- Dates (open, close, Q&A windows)
- Funding (amounts, duration for Phase 1 & 2)
- Technology areas & keywords
- Objectives & descriptions
- Phase-specific descriptions
- Q&A content from program office
- Restrictions & eligibility
- Consolidated instructions summary
- Source document links

### Cost
- **Model**: GPT-4o-mini
- **Cost per chat**: ~$0.0005 (half a cent)
- **Context**: ~3,000 tokens in, ~300 tokens out
- **Very affordable** for conversational AI

### Performance
- **Timeout**: 60 seconds (configured in `vercel.json`)
- **Response Time**: Typically 1-3 seconds
- **Conversation History**: Last 6 messages (sliding window)

## Integration Points

### Full Opportunity Pages
**Location**: `/opportunities/[topicNumber]`
- Chat button in top navigation
- Keyboard shortcut active (`⌘K` / `Ctrl+K`)
- Full data context available
- Modal overlay when chat is open

### Shared Guest Pages
**Location**: `/share/[token]`
- Feature blocked for guests
- Banner with upgrade prompt
- "Sign In to Use AI Chat" button
- Encourages conversion to full access

## Future Enhancements

### Planned
1. **External Award Data**: Include historical award information when available
2. **Persistent Chat History**: Optional database storage for chat threads
3. **Smart Suggestions**: Pre-populate common questions
4. **Export Transcript**: Download chat history as PDF/text
5. **Multi-Language**: Support for other languages

### Potential
- **Voice Input**: Speech-to-text for questions
- **Citations**: Link to specific PDF pages in source documents
- **Comparison Mode**: Ask about multiple opportunities at once
- **Reminders**: Set alerts for deadlines discussed in chat

## Testing

### Test Flow
1. Navigate to any active opportunity: `/opportunities/[topicNumber]`
2. Click "Ask AI About This Opportunity" or press `⌘K`
3. Ask: "What's the Phase 1 funding amount?"
4. Follow up: "What are the submission requirements?"
5. Test keyboard shortcuts (`Escape` to close, `⌘K` to reopen)

### Test on Share Page
1. Generate a share link from admin database
2. Open in incognito/private window
3. Verify chat is blocked with upgrade banner
4. Click "Sign In to Use AI Chat"

## Troubleshooting

### Chat not opening
- Check browser console for errors
- Verify you're logged in (not on a share page)
- Try refreshing the page

### Slow responses
- Normal for complex questions (3-5 seconds)
- Check OpenAI API status if consistently slow
- Verify timeout settings in `vercel.json`

### Incorrect answers
- AI is only as accurate as the data in `sbir_final` table
- Ensure opportunity data is up-to-date via scraper
- For complex requirements, always verify original source documents

## Support

### For Users
- AI responses are guidance only
- Always verify critical information in official documents
- Contact support for data accuracy issues

### For Developers
- OpenAI API key required (`OPENAI_API_KEY` in Vercel)
- Authentication via `requireAuth` middleware
- Logs available in Vercel function logs
- Model: `gpt-4o-mini` (can be changed in API route)

## Security

- **Authentication**: Required for all chat requests
- **Rate Limiting**: Handled by OpenAI (tier-based)
- **Data Privacy**: Conversations not stored (session-only)
- **Input Sanitization**: Handled by OpenAI API

## Monitoring

### Key Metrics
- Chat requests per day
- Average response time
- OpenAI API costs
- User satisfaction (future: feedback buttons)

### Logs
Check Vercel function logs for:
```
[Opportunity Chat] User {email} asking about {topic_number}
[Opportunity Chat] Response generated successfully
```

---

**Deployment**: October 29, 2025
**Version**: 1.0
**Status**: Live in Production

