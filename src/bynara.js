require('dotenv').config();
const { OpenAI } = require('openai');

const client = new OpenAI({
  apiKey: process.env.BYNARA_API_KEY,
  baseURL: 'https://router.bynara.id/v1',
});

const MODELS = {
  'agnes-2.0-flash': 'Agnes 2.0 Flash',
  'agnes-2.5-flash': 'Agnes 2.5 Flash',
  'agnes-2.5-pro': 'Agnes 2.5 Pro',
  'grok-4.5-free': 'Grok 4.5 Free',
  'laguna-s-2.1': 'Laguna S 2.1',
  'ling-3.0-flash-free': 'Ling 3.0 Flash Free',
  'longcat-2.0-free': 'Longcat 2.0 Free',
  'tencent-hy3-free': 'Tencent HY3 Free',
  'stepfun-3.7-flash': 'StepFun 3.7 Flash',
  'mistral-medium-3-5': 'Mistral Medium 3.5',
};

async function chat(messages, model = 'agnes-2.5-flash', options = {}) {
  const response = await client.chat.completions.create({
    model,
    messages,
    temperature: options.temperature ?? 0.7,
    max_tokens: options.maxTokens ?? 2048,
    stream: options.stream ?? false,
  });
  return response;
}

async function chatStream(messages, model = 'agnes-2.5-flash', options = {}) {
  const stream = await client.chat.completions.create({
    model,
    messages,
    temperature: options.temperature ?? 0.7,
    max_tokens: options.maxTokens ?? 2048,
    stream: true,
  });
  return stream;
}

function listModels() {
  return Object.entries(MODELS).map(([id, name]) => ({ id, name }));
}

module.exports = {
  chat,
  chatStream,
  listModels,
  MODELS,
};