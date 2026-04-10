const Tone = require('tone');
const bc = new Tone.BitCrusher();
console.log("BitCrusher wet:", !!bc.wet);
