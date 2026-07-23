// test-rich-blocks.js
const assert = require('assert')
const { parseRichTextToPlainAndEntities } = require('./utils/rich-text')

console.log('Testing RichBlock structural elements...')

// Test Table
const tableBlock = {
  type: 'RichBlockTable',
  rows: [
    { cells: ['Header 1', 'Header 2'] },
    { cells: ['Data 1', 'Data 2'] }
  ]
}
const tableResult = parseRichTextToPlainAndEntities(tableBlock)
assert.strictEqual(tableResult.text.includes('| Header 1 | Header 2 |'), true)
assert.strictEqual(tableResult.text.includes('| Data 1 | Data 2 |'), true)

// Test List
const listBlock = {
  type: 'RichBlockList',
  items: ['Item 1', 'Item 2']
}
const listResult = parseRichTextToPlainAndEntities(listBlock)
assert.strictEqual(listResult.text, '• Item 1\n• Item 2\n')

// Test Section Heading
const headingBlock = {
  type: 'RichBlockSectionHeading',
  title: 'My Heading'
}
const headingResult = parseRichTextToPlainAndEntities(headingBlock)
assert.strictEqual(headingResult.text, 'My Heading\n')
assert.strictEqual(headingResult.entities.some(e => e.type === 'bold'), true)

// Test Divider
const dividerBlock = { type: 'RichBlockDivider' }
const dividerResult = parseRichTextToPlainAndEntities(dividerBlock)
assert.strictEqual(dividerResult.text, '\n───\n')

// Test Thinking
const thinkingBlock = {
  type: 'RichBlockThinking',
  thought: 'Processing data'
}
const thinkingResult = parseRichTextToPlainAndEntities(thinkingBlock)
assert.strictEqual(thinkingResult.text.includes('Thinking: Processing data'), true)

console.log('All RichBlock tests passed!')
