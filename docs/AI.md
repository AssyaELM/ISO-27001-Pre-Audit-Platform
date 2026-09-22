# AI Integration

NormCore utilizes Large Language Models (LLMs) to automate the generation of compliance documentation and assist with context analysis.

## Providers

The platform is designed to be provider-agnostic, supporting:
- **Gemini** (Primary) via Google AI Studio.
- **OpenAI**
- **Groq**
- **OpenRouter**

Configurations and clients for these providers are located in `lib/ai/providers/`.

## AI Documents Generation

The core AI feature is the generation of required ISO 27001 documents (e.g., Information Security Policy, Access Control Policy).
The process works as follows:
1. **Context Gathering**: The system queries the database for the organization's assessment answers, gaps, and evidence.
2. **Semantic Write Gate**: The prompt is constructed and sent to the LLM to generate specific sections of a document.
3. **Hydration**: AI output is combined with static/deterministic data to form the final document.
4. **Validation**: The system verifies the structure of the AI response to prevent hallucinations or broken formatting.

## Setup

Set the relevant API key in `.env.local` (e.g., `GEMINI_API_KEY=...`).
No real keys should ever be hardcoded or committed.
