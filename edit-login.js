import { readFileSync, writeFileSync } from 'fs';
import fetch from 'node-fetch';
import 'dotenv/config';
import { diffLines } from 'diff';
import readline from 'readline/promises';

const API_KEY = process.env.GITHUB_TOKEN;
if (!API_KEY) {
  console.error('❌ GITHUB_TOKEN not found in environment');
  process.exit(1);
}

const BASE_URL = 'https://models.github.ai/inference/chat/completions';

async function askAI(prompt) {
  const response = await fetch(BASE_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 8000,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`API error (${response.status}): ${error}`);
  }

  const result = await response.json();
  return result.choices[0].message.content;
}

async function main() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const filePath = 'src/components/login-screen-multi-profile.tsx';
  const original = readFileSync(filePath, 'utf-8');

  const instruction = process.argv.slice(2).join(' ');
  if (!instruction) {
    console.log('Usage: node edit-login.js "your instruction here"');
    rl.close();
    return;
  }

  const prompt = `You are an expert React/TypeScript developer. I need to modify the file "${filePath}". Here is its current content:

\`\`\`tsx
${original}
\`\`\`

My request: ${instruction}

Please provide the **entire new content** of the file, without any extra explanation. Only the code. If no changes are needed, output the original content.`;

  console.log('🤖 Asking AI...');
  const newContent = await askAI(prompt);

  if (original === newContent) {
    console.log('No changes needed.');
    rl.close();
    return;
  }

  console.log('Diff:');
  const diff = diffLines(original, newContent);
  for (const part of diff) {
    const color = part.added ? '\x1b[32m' : part.removed ? '\x1b[31m' : '\x1b[90m';
    process.stdout.write(color + part.value + '\x1b[0m');
  }

  const answer = await rl.question(`\nApply changes to ${filePath}? (y/n): `);
  if (answer.toLowerCase() === 'y') {
    writeFileSync(filePath, newContent, 'utf-8');
    console.log('✅ Updated');
  } else {
    console.log('⏭️ Skipped');
  }

  rl.close();
  console.log('\n🎉 Done! Your dev server will now reload if running.');
}

main().catch(console.error);