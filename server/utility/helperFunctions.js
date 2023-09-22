swearWords = require("./swearWords");

function new4LetterId() {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let id = "";
  for (let i = 0; i < 4; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    id += characters.charAt(randomIndex);
  }
  if (swearWords.includes(id)) {
    console.log("swear word detected, trying again");
    return new4LetterId();
  }
  return id;
}

module.exports = {
  new4LetterId,
};
