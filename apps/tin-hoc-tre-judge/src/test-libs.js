const analysis = require('scratch-analysis');
const { loadSb3 } = require('sb-util');
const fs = require('fs');

async function test() {
  console.log('analysis type:', typeof analysis);
  console.log('loadSb3 type:', typeof loadSb3);
}

test();
