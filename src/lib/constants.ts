// Default model
export const DEFAULT_MODEL = 'openai/gpt-4o-mini';

// Allowed models for OpenRouter (whitelist — prevents cost abuse)
export const ALLOWED_MODELS = [
  'openai/gpt-4o-mini',
  'openai/gpt-4o',
  'anthropic/claude-3.5-haiku',
  'anthropic/claude-3.5-sonnet',
  'google/gemini-2.0-flash-thinking-exp',
  'mistralai/mistral-7b-instruct:free',
  'deepseek/deepseek-chat-v3-0324',
  'qwen/qwen-2.5-72b-instruct',
  'x-ai/grok-3',
  'meta-llama/llama-3.3-70b-instruct',
] as const;
