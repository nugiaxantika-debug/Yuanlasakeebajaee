const { gpt } = require('gpti');
gpt.v2({
    messages: [
        { role: "user", content: "Halo siapa kamu?" }
    ],
    markdown: false
}, (err, data) => {
    if(err) {
        console.error("error:", err);
    } else {
        console.log("success:", data);
    }
});
