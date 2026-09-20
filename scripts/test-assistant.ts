import assert from 'node:assert/strict';
import handler, { parseAssistantResponse } from '../api/chat-assistant';

const reply = { lang: 'it-IT', text: 'Apri il sito in Safari.' };
assert.deepEqual(parseAssistantResponse(JSON.stringify(reply)), reply);
assert.deepEqual(parseAssistantResponse('```json\n'+JSON.stringify(reply)+'\n```'), reply);
assert.deepEqual(parseAssistantResponse(JSON.stringify({lang:'it-IT',text:JSON.stringify(reply)})), reply);
assert.deepEqual(parseAssistantResponse(JSON.stringify(JSON.stringify(reply))), reply);
for (const raw of ['{"text": "ciao"}', '{ "lang": "it", "text": "Cerca l\'app "Jobs"" }', 'not json', '{"lang":"it","text":{}}']) {
  assert.throws(()=>parseAssistantResponse(raw));
}
const savedFetch=globalThis.fetch;
process.env.GEMINI_API_KEY='test-key';
let malformed=false;
globalThis.fetch=async(_input,init)=>{
  const request=JSON.parse(String(init?.body));
  assert.deepEqual(request.generationConfig.responseSchema.required,['lang','text']);
  const prompt=JSON.stringify(request.systemInstruction);
  assert(prompt.includes('NON è pubblicata su Apple App Store'));
  assert(prompt.includes('app.jobs-report.app'));
  assert(prompt.includes('390.00 EUR/anno'));
  assert(!prompt.includes('Disponibile nei piani Business e superiore'));
  return new Response(JSON.stringify({candidates:[{content:{role:'model',parts:[{text:malformed?'invalid':JSON.stringify(reply)}]},finishReason:'STOP'}]}),{status:200});
};
try {
  const request=()=>new Request('https://test.invalid/api/chat-assistant',{method:'POST',body:JSON.stringify({message:'come lo installo sul telefono?'})});
  const response=await handler(request());assert.equal(response.status,200);assert.deepEqual(await response.json(),reply);
  malformed=true;
  const oldError=console.error;console.error=()=>{};
  try { const bad=await handler(request());assert.equal(bad.status,500);assert(!(await bad.text()).includes('invalid')); }
  finally {console.error=oldError;}
  console.log('PASS: grounded instructions, shared pricing, response schema, nested JSON recovery and fail-closed malformed responses.');
} finally {globalThis.fetch=savedFetch;}
