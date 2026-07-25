const axios = require('axios');
async function run() {
  try {
    const res = await axios.post('https://www.blackbox.ai/api/chat', {
      messages: [{ id: "1", role: "user", content: "Halo" }],
      id: "1",
      previewToken: null,
      userId: null,
      codeModelMode: true,
      agentMode: {},
      trendingAgentMode: {},
      isMicMode: false,
      maxTokens: 1024,
      playgroundTopP: 0.9,
      playgroundTemperature: 0.5,
      isChromeExt: false,
      githubToken: null,
      clickedAnswer2: false,
      clickedAnswer3: false,
      clickedForceWebSearch: false,
      visitFromDelta: false,
      mobileClient: false,
      userSystemPrompt: null,
      metaTags: []
    });
    console.log(res.data);
  } catch(e) { console.error(e.message); }
}
run();
