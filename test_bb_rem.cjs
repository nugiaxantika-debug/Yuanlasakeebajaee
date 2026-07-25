const bb = require("betabotz-tools");
bb.removebg("https://www.google.com/images/branding/googlelogo/1x/googlelogo_color_272x92dp.png")
  .then(res => console.log(res))
  .catch(console.error);
