# AI Integration Guide for HomePilot

## Overview

HomePilot uses **Groq AI** to generate personalized financial advice and homebuying explanations. Groq provides free, blazing-fast inference with Llama models. The system automatically falls back to rule-based responses if Groq is not configured.

## 🚀 Quick Start with Groq (FREE & Fast)

Groq provides free, ultra-fast inference with Meta's Llama models - perfect for HomePilot!

1. **Get FREE API key**: https://console.groq.com/keys
2. **Add to your `.env`:**
   ```bash
   GROQ_API_KEY=gsk_your_key_here
   ```
3. **Restart backend** - that's it!

## 🎛️ Configuration

All AI settings are optional. Add to your `.env`:

```bash
# Groq API Key (OPTIONAL - uses rule-based mock if not set)
GROQ_API_KEY=gsk_your_key_here

# AI Configuration
AI_PROVIDER=groq                    # "groq" or "mock" for rule-based fallback
AI_MODEL=llama-3.3-70b-versatile    # Groq model to use
AI_TEMPERATURE=0.7                  # 0.0-1.0 (lower = more deterministic)
AI_MAX_TOKENS=500                   # Maximum tokens in response
```

### Available Groq Models

- `llama-3.3-70b-versatile` - Best quality, recommended (default)
- `llama-3.1-70b-versatile` - Fast and reliable
- `llama-3.1-8b-instant` - Fastest for simple queries
- `mixtral-8x7b-32768` - Good for longer context

## 📡 API Usage

### Endpoint: `POST /api/v1/ai/explain`

**Request:**
```json
{
  "monthly_income": 6000,
  "monthly_housing": 2000,
  "other_needs": 500,
  "is_affordable": true,
  "housing_pct_of_income": 33.33,
  "needs_budget_50": 3000,
  "remaining_needs_after_housing": 500,
  "pmi_monthly": 0,
  "term_years": 30
}
```

**Response:**
```json
{
  "narrative": "Your housing cost ($2,000/month) represents 33.3% of your take-home income. Combined with your other essential expenses ($500/month), you're well within the recommended 50% needs budget. This leaves you with healthy flexibility for discretionary spending and savings.",
  "suggestions": [
    "Consider building an emergency fund with your 20% savings allocation",
    "You have room to increase retirement contributions",
    "Review your wants budget to ensure you're building long-term wealth"
  ],
  "provider": "groq",
  "model": "llama-3.3-70b-versatile",
  "tokens_used": 287
}
```

**Response Fields:**
- `narrative` - 2-3 sentence AI-generated explanation
- `suggestions` - 2-4 actionable recommendations
- `provider` - Which AI was used ("groq" or "mock")
- `model` - Specific model name
- `tokens_used` - Token count

## 💰 Cost: Completely FREE!

Groq provides generous free tier access:

| Provider | Model | Cost per 1K requests | Cost per 1M requests |
|----------|-------|---------------------|---------------------|
| **Groq** | Llama 3.3 70B | **$0.00** | **$0.00** |

**Why Groq?**
- ✅ Completely **free** (generous limits)
- ⚡ **Ultra-fast** inference (up to 800 tokens/sec)
- 🎯 **High quality** with Llama 3.3 70B
- 🔓 **No credit card required**
- 🌐 **Great API** and reliability

## 🧪 Testing

The system automatically uses mock responses in tests (no API keys needed):

```bash
cd backend
pytest tests/test_api_ai.py -v
```

To test with real AI locally:
```bash
# Set API key temporarily
export GROQ_API_KEY=gsk_your_key_here

# Start backend
uvicorn app.main:app --reload

# Test manually
curl -X POST http://localhost:8000/api/v1/ai/explain \
  -H "Content-Type: application/json" \
  -d '{
    "monthly_income": 6000,
    "monthly_housing": 2000,
    "other_needs": 500,
    "is_affordable": true,
    "housing_pct_of_income": 33.33,
    "needs_budget_50": 3000,
    "remaining_needs_after_housing": 500
  }'
```

## 🔒 Security Best Practices

1. **Never commit API keys** - They're in `.env` which is gitignored
2. **Use environment variables** in production (Railway Secrets, Vercel Env Vars)
3. **Rotate keys regularly** (every 90 days recommended)
4. **Monitor usage** via Groq dashboard: https://console.groq.com/
5. **Set rate limits** if deploying to production with heavy traffic

## 🚧 Troubleshooting

### "Using mock provider (rule-based responses)"

**Cause:** `GROQ_API_KEY` not configured.

**Fix:** Set `GROQ_API_KEY` in your `.env` file and restart the backend.

### "Groq package not installed"

**Cause:** Missing dependencies.

**Fix:** 
```bash
cd backend
pip install -r requirements.txt
```

### "API error: 401 Unauthorized"

**Cause:** Invalid or expired API key.

**Fix:** 
1. Check your API key in `.env`
2. Verify it's active in Groq console: https://console.groq.com/keys
3. Generate a new key if needed

### Responses are generic/low quality

**Try:**
- Use `llama-3.3-70b-versatile` instead of smaller models
- Increase `AI_TEMPERATURE` to 0.8-0.9 for more creative responses
- Decrease `AI_TEMPERATURE` to 0.3-0.5 for more deterministic/factual responses

### Rate limit errors

**Solution:** 
- Groq has very generous free limits
- If you hit limits, wait a few minutes or upgrade your account
- Consider caching AI responses for common scenarios

## 📚 Resources

- **Groq Console**: https://console.groq.com/
- **Groq Documentation**: https://console.groq.com/docs
- **Get API Key**: https://console.groq.com/keys
- **Llama Model Info**: https://www.llama.com/

## 🎯 Advanced Usage

### Use Specific Model

```bash
# Use different Groq models for different needs
AI_MODEL=llama-3.3-70b-versatile      # Best quality (default)
AI_MODEL=llama-3.1-8b-instant         # Fastest responses
AI_MODEL=mixtral-8x7b-32768           # Longer context window
```

### Disable AI (use mock only)

```bash
AI_PROVIDER=mock
# No API keys needed - uses rule-based responses
```

## 📊 Monitoring Token Usage

Track usage in your application:

```python
from app.ai_services.explain import explain_affordability

result = explain_affordability(...)
print(f"Provider: {result.provider}")
print(f"Model: {result.model}")
print(f"Tokens used: {result.tokens_used}")
```

The response includes token counts for monitoring usage patterns.

## 🆘 Support

For issues:
1. Check the logs: `docker compose -f infrastructure/docker-compose.yml logs backend`
2. Verify `GROQ_API_KEY` is set in `.env`
3. Test API key at: https://console.groq.com/playground
4. Check Groq status page for outages

---

**Next Steps:**
1. Get a free Groq API key: https://console.groq.com/keys
2. Add to `.env`: `GROQ_API_KEY=gsk_your_key_here`
3. Restart backend: `docker compose restart backend`
4. Test: `curl http://localhost:9001/api/v1/ai/explain` with sample data

You now have production-ready AI integration! 🎉
