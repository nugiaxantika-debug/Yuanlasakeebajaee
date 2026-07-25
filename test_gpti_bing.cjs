const { bing } = require('gpti');
bing({
    messages: [{ role: "user", content: "halo" }],
    markdown: false
}, (err, data) => {
    console.log(err, data);
});
