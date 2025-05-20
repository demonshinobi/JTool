const test = require('node:test');
const assert = require('node:assert');

const Module = require('module');
const originalRequire = Module.prototype.require;
Module.prototype.require = function (path) {
  if (path === 'dompurify') {
    return { sanitize: (html) => html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '') };
  }
  return originalRequire.apply(this, arguments);
};

const formatter = require('../formatter.js');
Module.prototype.require = originalRequire;

test('formatText replaces {{text}} placeholders', () => {
  const result = formatter.formatText('hello', '<p>{{text}}</p>');
  assert.strictEqual(result, '<p>hello</p>');
});

test('sanitizeHtml strips unwanted tags', () => {
  const dirty = '<div><script>alert(1)</script><p>hi</p></div>';
  const clean = formatter.sanitizeHtml(dirty);
  assert.ok(!clean.includes('<script>'));
  assert.ok(clean.includes('<p>hi</p>'));
});
