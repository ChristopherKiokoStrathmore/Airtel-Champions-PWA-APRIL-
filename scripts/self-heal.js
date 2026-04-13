#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// ---------- CONFIGURATION ----------
const SUPABASE_PROJECT_REF = process.env.SUPABASE_PROJECT_REF;
const SUPABASE_ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const GROQ_API_KEY = process.env.GROQ_API_KEY;

// Path to your Edge Function
const FUNCTION_PATH = path.join(__dirname, '..', 'supabase', 'functions', 'activity-log', 'index.ts');

// Safety: patterns that are never allowed in generated code or commands
const FORBIDDEN_PATTERNS = [
  /\bDROP\b/i,
  /\bDELETE\b/i,
  /\bTRUNCATE\b/i,
  /\bALTER\s+TABLE\s+DROP\b/i,
  /\bREFRESH\s+MATERIALIZED\s+VIEW\b/i,
  /\bCREATE\s+OR\s+REPLACE\s+FUNCTION\b/i,
];

// ---------- HELPER: Call Groq LLM (free tier) ----------
async function callLLM(prompt, system, model = 'llama-3.3-70b-versatile') {
  console.log('🤖 Calling Groq LLM...');
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: prompt },
      ],
      max_tokens: 4000,
    }),
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Groq API error (${response.status}): ${errorText}`);
  }
  const data = await response.json();
  return data.choices[0].message.content;
}

// ---------- HELPER: Fetch error logs (from Supabase Edge Function logs) ----------
function fetchErrorLogs() {
  console.log('📡 Fetching recent error logs from Supabase...');
  try {
    const logs = execSync(
      `supabase functions logs activity-log --project-ref ${SUPABASE_PROJECT_REF} --limit 10 --format json`,
      { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'ignore'] }
    );
    const parsed = JSON.parse(logs);
    const errors = parsed.filter(entry => entry.level === 'error' || entry.message?.includes('500'));
    if (errors.length === 0) {
      console.log('⚠️ No errors found in logs, using simulated test error for demo.');
      return 'Test error: POST /functions/v1/activity-log returns 500 with "null value in column \"action\""';
    }
    return JSON.stringify(errors, null, 2);
  } catch (err) {
    console.log('⚠️ Could not fetch logs, using fallback error.');
    return 'Error: Edge Function activity-log is returning 500. Suspected field mapping issue.';
  }
}

// ---------- HELPER: Verify fix by calling live function ----------
async function verifyFix() {
  console.log('🔍 Verifying fix via direct HTTP request...');
  const functionUrl = `https://${SUPABASE_PROJECT_REF}.supabase.co/functions/v1/activity-log`;
  const testPayload = {
    userId: 'auto-heal-test',
    userName: 'Auto Heal',
    userRole: 'test',
    actionType: 'test_self_heal',
    actionDetails: { source: 'github-action' },
    timestamp: new Date().toISOString(),
  };
  try {
    const res = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify(testPayload),
    });
    const text = await res.text();
    if (res.status === 200) {
      console.log('✅ Verification successful: HTTP 200');
      return true;
    } else {
      console.log(`❌ Verification failed: HTTP ${res.status} - ${text}`);
      return false;
    }
  } catch (err) {
    console.log(`❌ Verification error: ${err.message}`);
    return false;
  }
}

// ---------- HELPER: Deploy fixed function ----------
function deployFunction() {
  console.log('🚀 Deploying fixed activity-log function...');
  execSync(`supabase functions deploy activity-log --project-ref ${SUPABASE_PROJECT_REF}`, {
    stdio: 'inherit',
  });
  console.log('✅ Deployment finished. Waiting 10s for propagation...');
  return new Promise(resolve => setTimeout(resolve, 10000));
}

// ---------- HELPER: Write the fixed code to disk ----------
function writeFunctionCode(code) {
  // Safety check: ensure no forbidden patterns
  for (const pattern of FORBIDDEN_PATTERNS) {
    if (pattern.test(code)) {
      throw new Error(`Generated code contains forbidden pattern: ${pattern.source}`);
    }
  }
  fs.writeFileSync(FUNCTION_PATH, code, 'utf-8');
  console.log('📝 Function code updated locally.');
}

// ---------- MAIN SELF-HEALING LOOP ----------
async function main() {
  console.log('🩺 Starting self-healing loop...');

  // 1. Get error context
  const errorLogs = fetchErrorLogs();
  console.log(`Error logs: ${errorLogs.substring(0, 500)}...`);

  // 2. Planner: create a fix plan (or decide no action)
  const plannerSystem = `You are a planner. Your job is to analyze error logs and output a step‑by‑step plan to fix the problem.
CRITICAL RULE: You are never allowed to plan any action that deletes, drops, truncates, or removes any database object. 
If the error requires a database deletion, respond with "IMPOSSIBLE: would require deletion".
Only suggest modifications to Edge Function code or environment variables.`;
  const planPrompt = `Error logs: ${errorLogs}\n\nCreate a detailed plan to resolve the issue. If no action is needed, output "NO_ACTION".`;
  let plan = await callLLM(planPrompt, plannerSystem);
  plan = plan.trim();
  console.log(`📋 Plan: ${plan}`);

  if (plan === 'NO_ACTION' || plan.includes('NO_ACTION')) {
    console.log('✅ No action needed. Exiting.');
    return;
  }
  if (plan.includes('IMPOSSIBLE')) {
    console.log('❌ Plan requires forbidden deletion. Aborting.');
    return;
  }

  // 3. Coder: generate the fixed code for Edge Function
  const coderSystem = `You are a coder. You will receive a plan and must output the complete, corrected content of the Edge Function file (supabase/functions/activity-log/index.ts).
RULES:
- Never include any DROP, DELETE, TRUNCATE, or ALTER TABLE DROP statements.
- You may only modify the function code itself (TypeScript).
- Use the existing pattern with serve() and Supabase client.
- Ensure proper field mapping from actionType → action and actionDetails → metadata.
- Output only the raw code, no explanations.`;
  const coderPrompt = `Plan: ${plan}\n\nCurrent function code (if any):\n${fs.existsSync(FUNCTION_PATH) ? fs.readFileSync(FUNCTION_PATH, 'utf-8') : '// Not yet created'}\n\nGenerate the corrected full code.`;
  let newCode = await callLLM(coderPrompt, coderSystem);
  // Extract code from possible markdown fences
  const codeMatch = newCode.match(/```(?:typescript|ts)?\n([\s\S]*?)\n```/);
  if (codeMatch) newCode = codeMatch[1];
  newCode = newCode.trim();

  // 4. Write and deploy
  try {
    writeFunctionCode(newCode);
    await deployFunction();
  } catch (err) {
    console.error(`❌ Deployment preparation failed: ${err.message}`);
    process.exit(1);
  }

  // 5. Evaluator: verify the fix (with retries)
  let success = false;
  for (let attempt = 1; attempt <= 3; attempt++) {
    console.log(`🔎 Verification attempt ${attempt}/3...`);
    success = await verifyFix();
    if (success) break;
    if (attempt < 3) {
      console.log('⏳ Waiting 30s before retry...');
      await new Promise(r => setTimeout(r, 30000));
    }
  }

  if (success) {
    console.log('🎉 Self-healing succeeded! The function now returns 200.');
    process.exit(0);
  } else {
    console.log('⚠️ Self-healing failed after 3 attempts. Manual intervention may be needed.');
    process.exit(1);
  }
}

// ---------- RUN ----------
main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
