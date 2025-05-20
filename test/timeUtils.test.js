const test = require('node:test');
const assert = require('node:assert');
const { formatMillisToHMS } = require('../01_Projects/JTool - attempt/src/utils/time');

test('formatMillisToHMS formats 0 correctly', () => {
  assert.strictEqual(formatMillisToHMS(0), '00:00:00');
});

test('formatMillisToHMS formats one second', () => {
  assert.strictEqual(formatMillisToHMS(1000), '00:00:01');
});

test('formatMillisToHMS formats minutes and hours', () => {
  assert.strictEqual(formatMillisToHMS(3661000), '01:01:01');
});

test('formatMillisToHMS handles invalid input', () => {
  assert.strictEqual(formatMillisToHMS('abc'), '00:00:00');
});
