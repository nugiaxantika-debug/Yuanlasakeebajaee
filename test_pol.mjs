const res = await fetch("https://image.pollinations.ai/prompt/cat?nologo=true");
console.log(res.status, res.headers.get("content-type"));
