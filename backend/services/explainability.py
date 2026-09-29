import os
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

_api_key = os.environ.get("GROQ_API_KEY")

# Only build the client if a key exists, so importing this module never crashes.
client = (
    OpenAI(api_key=_api_key, base_url="https://api.groq.com/openai/v1")
    if _api_key
    else None
)


def _fallback_explanation(destination_port, vessel_type, origin_region, match):
    """Plain, fact-only explanation used when the LLM is unavailable or returns nothing."""
    return (
        f"{destination_port} has {match['commodity']} available for export, which typically "
        f"goes to {match['destination_region']}. A {vessel_type} arriving from {origin_region} "
        f"could carry it on the return leg instead of sailing empty. "
        f"Data confidence for this match: {match['confidence']}."
    )


def explain_backhaul_match(destination_port, vessel_type, origin_region, match):
    prompt = f"""
You are writing a short explanation for a logistics manager inside a shipping decision-support tool.

Using ONLY the facts listed below, write a 2-sentence explanation of why this backhaul cargo
match was suggested. Do not introduce any numbers, ports, commodities, or claims that are not
explicitly listed below. Do not guess at revenue figures. Be plain and factual, not promotional.

Facts:
- Destination port: {destination_port}
- Vessel type: {vessel_type}
- Vessel's origin region: {origin_region}
- Export commodity available at destination: {match['commodity']}
- That commodity's typical destination region: {match['destination_region']}
- Data confidence level: {match['confidence']}
"""

    explanation_text = ""
    source = "llm"

    if client is None:
        source = "fallback"
    else:
        try:
            response = client.chat.completions.create(
                model="openai/gpt-oss-20b",
                max_tokens=600,
                reasoning_effort="low",
                messages=[{"role": "user", "content": prompt}],
            )
            # message.content is typed str | None, so guard it before .strip()
            explanation_text = (response.choices[0].message.content or "").strip()
        except Exception as e:
            print(f"Explainability LLM call failed: {e}")

    if not explanation_text:
        explanation_text = _fallback_explanation(
            destination_port, vessel_type, origin_region, match
        )
        source = "fallback"

    return {
        "explanation": explanation_text,
        "based_on": match,
        "source": source,  # "llm" or "fallback"
    }