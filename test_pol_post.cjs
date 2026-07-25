fetch('https://text.pollinations.ai/openai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        model: 'openai',
        messages: [{ role: 'user', content: 'hello' }]
    })
}).then(async r => {
    console.log(r.status);
    console.log(await r.text());
}).catch(console.error);
