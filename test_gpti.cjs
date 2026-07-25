const { gpt } = require('gpti');
gpt.v1({
    messages: [{ role: "user", content: "Halo" }],
    markdown: false,
    model: "GPT-4"
}, (err, data) => {
    console.log(err, data);
});
