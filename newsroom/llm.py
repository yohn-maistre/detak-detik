"""
The model lane (loop 1's narrator). Pydantic AI for typed output + ModelRetry;
LiteLLM as the unified, OpenAI-shaped gateway to every provider. The fallback
chain is NIM (main) -> Groq -> OpenRouter -> Gemini, all free tiers: each is an
OpenAIChatModel routed through LiteLLMProvider (which normalises auth + the API),
wrapped in Pydantic AI's FallbackModel, which advances to the next provider on a
model/API error.

If no provider key is present (local dry-run / CI without secrets) `build_model()`
returns None and the desks fall back to a deterministic, number-only finding. The
gate, not the model, is what guarantees truth; the model only phrases it.
"""

from __future__ import annotations

import os
from dataclasses import dataclass

# Provider table: (label, key env, base-url env, default base, model env, default model).
# NIM first = main; the rest are free-tier fallbacks, tried in order.
_PROVIDERS = [
    ("nim", "NIM_API_KEY", "NIM_BASE_URL", "https://integrate.api.nvidia.com/v1",
     "MODEL_PRIMARY", "deepseek-ai/deepseek-v4-pro"),
    ("groq", "GROQ_API_KEY", "GROQ_BASE_URL", "https://api.groq.com/openai/v1",
     "MODEL_GROQ", "llama-3.3-70b-versatile"),
    ("openrouter", "OPENROUTER_API_KEY", "OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1",
     "MODEL_OPENROUTER", "deepseek/deepseek-chat"),
    ("gemini", "GEMINI_API_KEY", "GEMINI_BASE_URL",
     "https://generativelanguage.googleapis.com/v1beta/openai",
     "MODEL_GEMINI", "gemini-2.0-flash"),
]


@dataclass
class LaneInfo:
    labels: list[str]  # which providers are wired, in fallback order


def configured_providers() -> list[str]:
    return [label for (label, key_env, *_rest) in _PROVIDERS if os.environ.get(key_env)]


def model_available() -> bool:
    return bool(configured_providers())


def build_model():
    """Return a Pydantic AI model (FallbackModel over the keyed providers) or None.

    Construction is offline (no network): we only verify a model can be built.
    The actual calls happen at agent.run() time, in GitHub Actions, with keys."""
    present = [p for p in _PROVIDERS if os.environ.get(p[1])]
    if not present:
        return None

    from pydantic_ai.models.fallback import FallbackModel
    from pydantic_ai.models.openai import OpenAIChatModel
    from pydantic_ai.providers.litellm import LiteLLMProvider

    members = []
    for _label, key_env, base_env, base_default, model_env, model_default in present:
        provider = LiteLLMProvider(
            api_key=os.environ[key_env],
            api_base=os.environ.get(base_env, base_default),
        )
        members.append(
            OpenAIChatModel(os.environ.get(model_env, model_default), provider=provider)
        )

    if len(members) == 1:
        return members[0]
    return FallbackModel(members[0], *members[1:])
