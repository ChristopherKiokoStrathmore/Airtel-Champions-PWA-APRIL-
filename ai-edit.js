import { readFileSync, writeFileSync } from 'fs';
import { glob } from 'glob';
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

async function collectFiles(pattern = 'src/**/*.{ts,tsx}') {
  return await glob(pattern, { ignore: 'node_modules/**' });
}

async function editFile(filePath, instruction) {
  let original = readFileSync(filePath, 'utf-8');
  const maxChars = 10000; // reduced from 15000
  let truncated = false;
  if (original.length > maxChars) {
    console.log(`⚠️ File too large (${original.length} chars), truncating to ${maxChars} chars`);
    original = original.slice(0, maxChars) + '\n... (truncated)';
    truncated = true;
  }
  const prompt = `You are an expert React/TypeScript developer. I need to modify the file "${filePath}". Here is its current content${truncated ? ' (truncated)' : ''}:

\`\`\`tsx
${original}
\`\`\`

My request: ${instruction}

Please provide the **entire new content** of the file, without any extra explanation. Only the code. If no changes are needed, output the original content.`;

  const newContent = await askAI(prompt);
  return { filePath, original, newContent };
}

function showDiff(original, newContent) {
  const diff = diffLines(original, newContent);
  let diffOutput = '';
  for (const part of diff) {
    const color = part.added ? '\x1b[32m' : part.removed ? '\x1b[31m' : '\x1b[90m';
    diffOutput += color + part.value + '\x1b[0m';
  }
  console.log(diffOutput);
}

async function confirmAction(rl, filePath) {
  const answer = await rl.question(`Apply changes to ${filePath}? (y/n): `);
  return answer.toLowerCase() === 'y';
}

async function main() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const instruction = process.argv.slice(2).join(' ');
  if (!instruction) {
    console.log('Usage: node ai-edit.js "your instruction here"');
    rl.close();
    return;
  }

  console.log('📂 Collecting relevant files...');
  const allFiles = await collectFiles();

  // Ask AI which files to edit
  const fileListPrompt = `Here are all the source files in the project:\n${allFiles.join('\n')}\n\nMy request: ${instruction}\n\nWhich files need to be modified to achieve this? Return only the file paths, one per line.`;
  const fileListResponse = await askAI(fileListPrompt);
  const targetFiles = fileListResponse.split('\n').filter(line => line.trim() && allFiles.includes(line.trim()));

  if (targetFiles.length === 0) {
    console.log('No files identified for change. Try being more specific.');
    rl.close();
    return;
  }

  console.log(`\n📝 Will edit ${targetFiles.length} file(s):`);
  targetFiles.forEach(f => console.log(`   ${f}`));

  for (const file of targetFiles) {
    console.log(`\n--- Editing ${file} ---`);
    const { original, newContent } = await editFile(file, instruction);
    if (original === newContent) {
      console.log('No changes needed.');
      continue;
    }
    console.log('Diff:');
    showDiff(original, newContent);
    if (await confirmAction(rl, file)) {
      writeFileSync(file, newContent, 'utf-8');
      console.log(`✅ Updated ${file}`);
    } else {
      console.log(`⏭️ Skipped ${file}`);
    }
  }

  rl.close();
  console.log('\n🎉 Done! Your dev server will now reload if running.');
}

main().catch(console.error);