"""
Scenario-aware chat with Groq. The advisor has context about the user's
current numbers (home value, payment, income, risk, projection) and
answers questions about affordability, next steps, and trade-offs.
"""
from app.config import settings
from app.ai_services.providers import get_ai_provider
from app.schemas.ai import ScenarioContext, ChatMessage, ChatResponse


def _build_system_prompt(ctx: ScenarioContext) -> str:
    affordable_str = "yes" if ctx.is_affordable else "no"
    parts = [
        "You are HomePilot's homebuying advisor. The user is looking at a specific scenario. Use their numbers when answering.",
        "",
        "Current scenario:",
        f"- Home value: ${ctx.home_value:,.0f}",
        f"- Down payment: ${ctx.down_payment:,.0f}",
        f"- Total monthly housing cost: ${ctx.monthly_payment_total:,.0f}",
        f"- Monthly take-home income: ${ctx.monthly_income:,.0f}",
        f"- Housing as % of income: {ctx.housing_pct_of_income:.1f}%",
        f"- Affordable under 50/30/20: {affordable_str}",
    ]
    if ctx.risk_summary:
        parts.append("")
        parts.append("Risk analysis:")
        parts.append(ctx.risk_summary)
    if ctx.projection_summary:
        parts.append("")
        parts.append("5-year projection:")
        parts.append(ctx.projection_summary)
    parts.extend([
        "",
        "Format every reply for easy reading:",
        "- Use short paragraphs; separate paragraphs with a blank line.",
        "- Use bullet points (• or -) for lists of steps, options, or risks.",
        "- Put key numbers on their own line or at the start of a sentence.",
        "- Keep responses concise and scannable; 2–4 short paragraphs or a short list is enough.",
        "Reference their numbers. For affordability questions suggest concrete changes (down payment, price, term). For risk, explain in plain language.",
    ])
    return "\n".join(parts)


def chat(messages: list[ChatMessage], scenario_context: ScenarioContext) -> ChatResponse:
    """
    Run one round of chat: user messages + scenario context -> assistant reply.
    Uses Groq when configured, otherwise returns a short fallback.
    """
    provider = get_ai_provider()
    system_prompt = _build_system_prompt(scenario_context)

    groq_messages = [{"role": "system", "content": system_prompt}]
    for m in messages[-10:]:
        groq_messages.append({"role": m.role, "content": m.content})

    ai_response = provider.chat_completion(
        groq_messages,
        temperature=0.6,
        max_tokens=600,
    )

    return ChatResponse(
        message=ChatMessage(role="assistant", content=ai_response.content),
        provider=ai_response.provider,
        model=ai_response.model,
        tokens_used=ai_response.tokens_used,
    )
