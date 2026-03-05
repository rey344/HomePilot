# AI Integration Guide for HomePilot

## Overview

HomePilot now includes **real AI integration** using multiple LLM providers to generate personalized financial advice and homebuying explanations. The system automatically falls back to rule-based responses if no AI provider is configured.

## 🚀 Quick Start

### Option 1: Groq (FREE, Fast) - RECOMMENDED

Groq provides free, blazing-fast inference with Llama models.

1. **Get API key** (free): https://console.groq.com/keys
2. **Add to your `.env`:**
   ```bash
   GROQ_API_KEY=gsk_your_key_here
   ```
3. **Restart backend** - that's it!

### Option 2: OpenAI

Best quality but costs ~$0.15 per 1M tokens (very affordable).

1. **Get API key**: https://platform.openai.com/api-keys
2. **Add to your `.env`:**
   ```bash
   OPENAI_API_KEY=sk-your_key_here
   ```
3. **Restart backend**

### Option 3: Anthropic Claude

Excellent quality, ~$1 per 1M tokens.

1. **Get API key**: https://console.anthropic.com/
2. **Add to your `.env`:**
   ```bash
   ANTHROPIC_API_KEY=sk-ant-your_key_here
   ```
3. **Restart backend**

## 🎛️ Configuration

All AI settings are optional. Add to your `.env`:

```bash
# API Keys (set at least one to enable AI)
GROQ_API_KEY=         # FREE, fastest (recommended)
OPENAI_API_KEY=       # Excellent quality (~$0.15/1M tokens)
ANTHROPIC_API_KEY=    # Excellent quality (~$1/1M tokens)

# Provider Selection
AI_PROVIDER=auto      # "auto", "groq", "openai", "anthropic", or "mock"
                      # auto = tries Groq → OpenAI → Anthropic → mock

# Model Selection
AI_MODEL=auto         # "auto" for smart defaults, or specify:
                      # OpenAI: "gpt-4o-mini", "gpt-4o", "gpt-4-turbo"
                      # Groq: "llama-3.3-70b-versatile", "llama-3.1-8b-instant"
                      # Anthropic: "claude-3-5-haiku-20241022", "claude-3-5-sonnet-20241022"

# Generation Settings
AI_TEMPERATURE=0.7    # 0.0-1.0 (lower = more deterministic)
AI_MAX_TOKENS=500     # Maximum tokens in response
```

## 🔄 Provider Priority (AI_PROVIDER=auto)

When `AI_PROVIDER=auto`, the system tries providers in this order:

1. **Groq** (if `GROQ_API_KEY` set) - Free, fastest
2. **OpenAI** (if `OPENAI_API_KEY` set) - Excellent quality
3. **Anthropic** (if `ANTHROPIC_API_KEY` set) - Excellent quality
4. **Mock** (fallback) - Rule-based responses

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
- `provider` - Which AI was used ("groq", "openai", "anthropic", "mock")
- `model` - Specific model name
- `tokens_used` - Token count (for cost tracking)

## 💰 Cost Estimates

Based on typical HomePilot usage (~300 tokens per request):

| Provider | Model | Cost per 1K requests | Cost per 1M requests |
|----------|-------|---------------------|---------------------|
| **Groq** | Llama 3.1 70B | **$0.00** | **$0.00** |
| **OpenAI** | GPT-4o-mini | $0.05 | $50 |
| **Anthropic** | Claude 3.5 Haiku | $0.30 | $300 |

**Recommendation:** Start with Groq (free tier is generous) for development and moderate production use.

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
4. **Monitor usage** via provider dashboards:
   - Groq: https://console.groq.com/
   - OpenAI: https://platform.openai.com/usage
   - Anthropic: https://console.anthropic.com/settings/usage
5. **Set spending limits** in provider dashboards to prevent overuse

## 🚧 Troubleshooting

### "Using mock provider (rule-based responses)"

**Cause:** No API keys configured.

**Fix:** Set `GROQ_API_KEY` or `OPENAI_API_KEY` in your `.env` file.

### "OpenAI package not installed"

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
2. Verify it's active in provider dashboard
3. Generate a new key if needed

### Responses are generic/low quality

**Try:**
1. Lower `AI_TEMPERATURE` (0.3-0.5 for more focused responses)
2. Switch to a better model (GPT-4o instead of GPT-4o-mini)
3. Increase `AI_MAX_TOKENS` if responses are cut off

## 🎯 Advanced Usage

### Force Specific Provider

```bash
# Always use OpenAI (ignore Groq even if key is set)
AI_PROVIDER=openai
OPENAI_API_KEY=sk-your_key_here
```

### Use Specific Model

```bash
# Use the most capable (but expensive) models
AI_PROVIDER=auto
AI_MODEL=gpt-4o  # For OpenAI
# or
AI_MODEL=llama-3.1-405b-reasoning  # For Groq (if available)
```

### Disable AI (use mock only)

```bash
AI_PROVIDER=mock
# No API keys needed
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

The response includes token counts for cost tracking and monitoring.

## 🔗 Provider Documentation

- **Groq**: https://console.groq.com/docs/quickstart
- **OpenAI**: https://platform.openai.com/docs/quickstart
- **Anthropic**: https://docs.anthropic.com/claude/docs/quickstart

## 🆘 Support

For issues:
1. Check the logs: `docker compose -f infrastructure/docker-compose.yml logs backend`
2. Verify `.env` variables are set correctly
3. Test API key with provider's CLI or playground
4. Check provider status pages for outages

---

**Next Steps:**
1. Get a free Groq API key: https://console.groq.com/keys
2. Add to `.env`: `GROQ_API_KEY=gsk_your_key_here`
3. Restart backend: `docker compose restart backend`
4. Test: `curl http://localhost:9001/api/v1/ai/explain` with sample data

You now have production-ready AI integration! 🎉
