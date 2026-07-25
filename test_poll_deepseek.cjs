async function run() {
    const payload = {
        model: "deepseek",
        messages: [{ role: "user", content: "Halo, siapa kamu?" }]
    };
    const response = await fetch('https://text.pollinations.ai/openai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    const data = await response.json();
    console.log(data?.choices?.[0]?.message?.content);
}
run();
