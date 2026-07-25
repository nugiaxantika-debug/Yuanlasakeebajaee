import { init } from 'duck-ai';
try {
  const agent = init({ fast: true, headless: true });
  const chat = await agent.newChat('gpt-4o-mini');
  const res = await chat.ask('hello');
  console.log("Duck AI Response:", res);
} catch (e) { console.error(e); }
