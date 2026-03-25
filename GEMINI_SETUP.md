# Gemini Flash Setup for Development

## How to Get Your Free Gemini API Key

1. **Go to Google AI Studio**
   - Visit: https://makersuite.google.com/app/apikey
   - Sign in with your Google account

2. **Create a New API Key**
   - Click "Create API Key" in a new project
   - Name your project (e.g., "KurrAlert Dev")
   - Copy the API key

3. **Add to .env File**
   ```bash
   GEMINI_API_KEY=your_actual_gemini_api_key_here
   ```

4. **Restart the API Server**
   ```bash
   # Stop the current server (Ctrl+C)
   cd apps/api
   npm run dev
   ```

## How It Works

### Development Mode (NODE_ENV=development)
- Uses: **Gemini Flash 2.0** (gemini-2.0-flash-exp)
- Cost: **FREE** (up to 15 requests per minute)
- Model: Fast, experimental model
- Requirements: Just `GEMINI_API_KEY` in .env

### Production Mode (NODE_ENV=production)
- Uses: **Claude Sonnet 4.6** (claude-sonnet-4-6)
- Cost: Paid per token
- Model: Production-ready, reliable
- Requirements: `ANTHROPIC_API_KEY` in .env

## Verification

After setup, you should see this in the API logs when generating content:

**Development:**
```
[AIService] Using Gemini for development
[GeminiService] Content generation complete for draft xxx
```

**Production:**
```
[AIService] Using Claude for production
[ClaudeService] Content generation complete for draft xxx
```

## Free Tier Limits

**Gemini Flash 2.0:**
- 15 requests per minute
- 1,500 requests per day
- FREE forever

This should be more than enough for development and testing!

## Switching Between Providers (Optional)

If you want to test with Claude in development:

```bash
# Temporary switch (current session only)
export NODE_ENV=production
cd apps/api && npm run dev

# Permanent switch
# Change NODE_ENV=production in .env
```

## Troubleshooting

**Error: "API key not valid"**
- Check that GEMINI_API_KEY is set correctly
- Verify the key at https://makersuite.google.com/app/apikey
- Make sure there are no extra spaces in the .env file

**Error: "Model not found"**
- The model name is automatically set to `gemini-2.0-flash-exp`
- This is the latest free Flash model
- No need to change it

**Want to use Claude in dev anyway?**
- Set both `ANTHROPIC_API_KEY` and `GEMINI_API_KEY`
- Change `NODE_ENV=production` in .env
- System will automatically use Claude

## Model Comparison

| Feature | Gemini Flash 2.0 | Claude Sonnet 4.6 |
|---------|------------------|------------------|
| Cost | FREE | Paid |
| Speed | Very Fast | Fast |
| Quality | Good | Excellent |
| Use Case | Development | Production |
| Environment | NODE_ENV=development | NODE_ENV=production |
