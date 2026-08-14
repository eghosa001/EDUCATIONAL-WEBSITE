require('dotenv').config();
const { chat, chatStream, listModels } = require('../src/bynara');

async function main() {
  console.log('Available models:');
  listModels().forEach(m => console.log(`  - ${m.id}: ${m.name}`));

  const messages = [
    { role: 'system', content: 'You are a helpful educational assistant.' },
    { role: 'user', content: 'Explain photosynthesis in simple terms for a 5th grader.' },
  ];

  console.log('\n--- Non-streaming response ---');
  const response = await chat(messages, 'agnes-2.5-flash');
  console.log(response.choices[0].message.content);

  console.log('\n--- Streaming response ---');
  const stream = await chatStream(messages, 'agnes-2.5-flash');
  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content || '';
    process.stdout.write(content);
  }
  console.log();
}

main().catch(console.error);