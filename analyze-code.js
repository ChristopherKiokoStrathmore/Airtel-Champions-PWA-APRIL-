import { readFileSync } from 'fs';
import { glob } from 'glob';
import fetch from 'node-fetch';

const API_KEY = process.env.GITHUB_TOKEN;
if (!API_KEY) {
  console.error('❌ Please set GITHUB_TOKEN environment variable');
  process.exit(1);
}

const BASE_URL = 'https://models.github.ai/inference/chat/completions';

async function analyze() {
  console.log('📁 Reading source files...');
  const files = await glob('src/**/*.{ts,tsx}', { ignore: 'node_modules/**' });
  if (files.length === 0) {
    console.log('⚠️ No .ts or .tsx files found in src/');
    return;
  }
  console.log(`📄 Found ${files.length} files`);

  // Combine file contents (limit to avoid token limit)
  const fileContents = files.map(f => `=== ${f} ===\n${readFileSync(f, 'utf-8')}`).join('\n\n');
  const maxChars = 50000; // adjust as needed
  const truncated = fileContents.slice(0, maxChars);
  if (truncated.length < fileContents.length) {
    console.log(`⚠️ Truncated to ${maxChars} chars (original ${fileContents.length})`);
  }

  const prompt = `You are an expert React/TypeScript developer. Review the following codebase for bugs, performance issues, and best practices. Focus on PWA, Supabase integration, and state management. Suggest concrete improvements.\n\n${truncated}`;

  console.log('🤖 Sending to GitHub Models...');
  const response = await fetch(BASE_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 4000,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error(`❌ API error (${response.status}): ${error}`);
    return;
  }

  const result = await response.json();
  console.log('\n✅ Analysis:\n');
  console.log(result.choices[0].message.content);
}

analyze().catch(console.error);