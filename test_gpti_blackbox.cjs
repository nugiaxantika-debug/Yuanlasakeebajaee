const { blackbox } = require('gpti');
blackbox({
    messages: [{ role: "user", content: "halo" }],
    markdown: false
}, (err, data) => {
    console.log(err, data);
});
