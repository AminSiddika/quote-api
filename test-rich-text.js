// test-rich-text.js
const assert = require('assert')
const { isRichTextPayload, parseRichTextToPlainAndEntities } = require('./utils/rich-text')

console.log('Testing RichText parser...')

// Test 1: Simple AST structure
const sample1 = [
  { type: 'RichTextBold', text: 'Hello ' },
  { type: 'RichTextItalic', text: 'World' }
]

assert.strictEqual(isRichTextPayload({ rich_text: sample1 }), true)

const result1 = parseRichTextToPlainAndEntities(sample1)
assert.strictEqual(result1.text, 'Hello World')
assert.strictEqual(result1.entities.length, 2)
assert.strictEqual(result1.entities[0].type, 'bold')
assert.strictEqual(result1.entities[0].offset, 0)
assert.strictEqual(result1.entities[0].length, 6)
assert.strictEqual(result1.entities[1].type, 'italic')
assert.strictEqual(result1.entities[1].offset, 6)
assert.strictEqual(result1.entities[1].length, 5)

// Test 2: Invisible / stealth message handling
const sample2 = {
  type: 'invisible',
  placeholder: '•••'
}
const result2 = parseRichTextToPlainAndEntities(sample2)
assert.strictEqual(result2.text, '•••')
assert.strictEqual(result2.entities[0].type, 'spoiler')

console.log('All RichText tests passed!')
