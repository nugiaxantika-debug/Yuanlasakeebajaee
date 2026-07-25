const { gpt, bing, blackbox, nexra, llama } = require('gpti');

function testCallback(name) {
    return (err, res) => {
        if(err) console.log(name, "Error:", err);
        else console.log(name, "Success:", JSON.stringify(res).substring(0,100));
    }
}

gpt.v1({ messages: [{role:'user',content:'halo'}], markdown: false }, testCallback('gpt.v1'));
gpt.v2({ messages: [{role:'user',content:'halo'}], markdown: false }, testCallback('gpt.v2'));
gpt.web({ prompt: 'halo', markdown: false }, testCallback('gpt.web'));
bing({ messages: [{role:'user',content:'halo'}], markdown: false }, testCallback('bing'));
blackbox({ messages: [{role:'user',content:'halo'}], markdown: false }, testCallback('blackbox'));
llama({ messages: [{role:'user',content:'halo'}], markdown: false }, testCallback('llama'));
