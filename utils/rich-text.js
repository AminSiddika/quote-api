// utils/rich-text.js
// Complete RichText & RichMessage parser supporting all Telegram Bot API 10.1 features.

/**
 * Universal RichText / RichMessage AST converter for Telegram Bot API 10.1 (June 11, 2026).
 *
 * Supports ALL RichText formatting elements:
 * - RichTextPlain
 * - RichTextBold
 * - RichTextItalic
 * - RichTextUnderline
 * - RichTextStrikethrough
 * - RichTextCode
 * - RichTextPre
 * - RichTextSpoiler
 * - RichTextUrl / RichTextLink
 * - RichTextEmailAddress
 * - RichTextPhoneNumber
 * - RichTextBankCardNumber
 * - RichTextMention
 * - RichTextHashtag
 * - RichTextCashtag
 * - RichTextBotCommand
 * - RichTextTextMention
 * - RichTextCustomEmoji
 * - RichTextDateTime
 * - RichTextSubscript
 * - RichTextSuperscript
 * - RichTextMarked
 * - RichTextAnchor / RichTextAnchorLink
 *
 * Supports ALL RichBlock layout elements:
 * - RichBlockParagraph
 * - RichBlockSectionHeading
 * - RichBlockDivider
 * - RichBlockTable & RichBlockTableCell
 * - RichBlockList & RichBlockListItem (ordered/unordered)
 * - RichBlockQuote & RichBlockCode
 * - RichBlockDetails (collapsible summary)
 * - RichBlockFooter
 * - RichBlockThinking (AI reasoning state)
 * - RichBlockPhoto, RichBlockVideo, RichBlockAudio, RichBlockAnimation, RichBlockVoiceNote
 * - RichBlockCollage, RichBlockSlideshow
 * - RichBlockMap
 * - Invisible / Stealth message states
 */

function isRichTextPayload (payload) {
  if (!payload) return false
  if (payload.rich_message || payload.richMessage || payload.rich_text || payload.richText || payload.rich_blocks || payload.richBlocks) return true
  if (typeof payload === 'object' && payload.type && (payload.type.startsWith('Rich') || payload.children || payload.blocks || payload.rows || payload.items)) return true
  if (Array.isArray(payload) && payload.length > 0) {
    const first = payload[0]
    if (first && first.type && (first.type.startsWith('RichBlock') || first.type.startsWith('richText') || first.type.startsWith('RichText'))) return true
  }
  return false
}

function parseRichTextToPlainAndEntities (richText, currentOffset = 0) {
  let text = ''
  const entities = []

  if (!richText) return { text, entities }

  if (typeof richText === 'string') {
    return { text: richText, entities }
  }

  if (Array.isArray(richText)) {
    for (const item of richText) {
      const res = parseRichTextToPlainAndEntities(item, currentOffset + text.length)
      text += res.text
      entities.push(...res.entities)
    }
    return { text, entities }
  }

  // Extract root rich_message or rich_blocks
  if (richText.rich_message || richText.richMessage) {
    return parseRichTextToPlainAndEntities(richText.rich_message || richText.richMessage, currentOffset)
  }
  if (richText.blocks || richText.rich_blocks || richText.richBlocks) {
    return parseRichTextToPlainAndEntities(richText.blocks || richText.rich_blocks || richText.richBlocks, currentOffset)
  }

  const rawType = richText.type || ''
  const type = rawType.replace(/^Rich(Text|Block)?/, '').toLowerCase()

  // 1. Invisible / Stealth Message
  if (richText.invisible || richText.stealth || type === 'invisible') {
    if (richText.placeholder) {
      const len = richText.placeholder.length
      return { text: richText.placeholder, entities: [{ type: 'spoiler', offset: currentOffset, length: len }] }
    }
    return { text: '', entities: [] }
  }

  // 2. RichTextDateTime
  if (type === 'datetime' || type === 'date' || type === 'time') {
    const formatted = richText.formatted || richText.text || (richText.timestamp ? new Date(richText.timestamp * 1000).toLocaleString() : '📅')
    return { text: formatted, entities: [{ type: 'code', offset: currentOffset, length: formatted.length }] }
  }

  // 3. RichBlockDivider
  if (type === 'divider' || type === 'hr') {
    return { text: '\n───\n', entities: [] }
  }

  // 4. RichBlockParagraph
  if (type === 'paragraph' || type === 'p') {
    const childContent = richText.text || richText.content || richText.children || ''
    const res = parseRichTextToPlainAndEntities(childContent, currentOffset)
    return { text: res.text + '\n\n', entities: res.entities }
  }

  // 5. RichBlockSectionHeading
  if (type === 'sectionheading' || type === 'heading' || type === 'h1' || type === 'h2' || type === 'h3') {
    const childContent = richText.text || richText.content || richText.children || richText.title || ''
    const res = parseRichTextToPlainAndEntities(childContent, currentOffset)
    const headText = res.text.trim() + '\n'
    const headEntities = res.entities.concat([{ type: 'bold', offset: currentOffset, length: res.text.trim().length }])
    return { text: headText, entities: headEntities }
  }

  // 6. RichBlockThinking
  if (type === 'thinking' || type === 'thought') {
    const childContent = richText.text || richText.content || richText.children || richText.thought || 'Thinking...'
    const prefix = '💡 Thinking: '
    const res = parseRichTextToPlainAndEntities(childContent, currentOffset + prefix.length)
    const thinkText = prefix + res.text + '\n'
    const thinkEntities = [{ type: 'italic', offset: currentOffset, length: thinkText.length - 1 }].concat(res.entities)
    return { text: thinkText, entities: thinkEntities }
  }

  // 7. RichBlockDetails
  if (type === 'details' || type === 'disclosure') {
    const summary = richText.summary || richText.title || 'Details'
    const childContent = richText.text || richText.content || richText.children || ''
    const prefix = `▶ ${summary}\n`
    const res = parseRichTextToPlainAndEntities(childContent, currentOffset + prefix.length)
    const detailsText = prefix + res.text + '\n'
    const detailsEntities = [{ type: 'bold', offset: currentOffset, length: prefix.length - 1 }].concat(res.entities)
    return { text: detailsText, entities: detailsEntities }
  }

  // 8. RichBlockFooter
  if (type === 'footer') {
    const childContent = richText.text || richText.content || richText.children || ''
    const prefix = '\n— '
    const res = parseRichTextToPlainAndEntities(childContent, currentOffset + prefix.length)
    const footerText = prefix + res.text + '\n'
    const footerEntities = [{ type: 'italic', offset: currentOffset + prefix.length, length: res.text.length }].concat(res.entities)
    return { text: footerText, entities: footerEntities }
  }

  // 9. RichBlockList & RichBlockListItem
  if (type === 'list' || type === 'unorderedlist' || type === 'orderedlist') {
    const items = richText.items || richText.children || []
    let listText = ''
    const listEntities = []
    const isOrdered = type === 'orderedlist' || richText.ordered

    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      const bullet = isOrdered ? `${i + 1}. ` : '• '
      const bulletOffset = currentOffset + listText.length
      listText += bullet

      const res = parseRichTextToPlainAndEntities(item, bulletOffset + bullet.length)
      listText += res.text + '\n'
      listEntities.push(...res.entities)
    }
    return { text: listText, entities: listEntities }
  }

  // 10. RichBlockTable & RichBlockTableCell
  if (type === 'table') {
    const rows = richText.rows || richText.children || []
    let tableText = ''
    const tableEntities = []

    for (const row of rows) {
      const cells = row.cells || row.children || (Array.isArray(row) ? row : [])
      const cellTexts = []
      for (const cell of cells) {
        const res = parseRichTextToPlainAndEntities(cell, currentOffset + tableText.length)
        cellTexts.push(res.text.trim())
        tableEntities.push(...res.entities)
      }
      tableText += '| ' + cellTexts.join(' | ') + ' |\n'
    }
    return { text: tableText, entities: tableEntities }
  }

  // 11. RichBlockMap
  if (type === 'map' || type === 'location') {
    const label = richText.title || richText.label || `📍 Location (${richText.latitude || 0}, ${richText.longitude || 0})`
    return { text: label + '\n', entities: [{ type: 'bold', offset: currentOffset, length: label.length }] }
  }

  // 12. Media blocks (RichBlockPhoto, RichBlockVideo, RichBlockAudio, RichBlockAnimation, RichBlockVoiceNote, RichBlockCollage, RichBlockSlideshow)
  if (type === 'photo' || type === 'video' || type === 'audio' || type === 'animation' || type === 'voicenote' || type === 'collage' || type === 'slideshow') {
    const caption = richText.caption ? parseRichTextToPlainAndEntities(richText.caption, currentOffset) : { text: '', entities: [] }
    const mediaTag = `[${type.toUpperCase()}] `
    const fullMediaText = mediaTag + caption.text + '\n'
    const mediaEntities = [{ type: 'code', offset: currentOffset, length: mediaTag.length }].concat(caption.entities)
    return { text: fullMediaText, entities: mediaEntities }
  }

  // 13. Inline RichText elements
  const childContent = richText.text || richText.content || richText.children || richText.value || ''
  const startOffset = currentOffset

  let nodeText = ''
  if (typeof childContent === 'string') {
    nodeText = childContent
  } else {
    const res = parseRichTextToPlainAndEntities(childContent, currentOffset)
    nodeText = res.text
    entities.push(...res.entities)
  }

  const length = nodeText.length

  let entityType = null
  switch (type) {
    case 'bold':
    case 'b':
      entityType = 'bold'
      break
    case 'italic':
    case 'i':
      entityType = 'italic'
      break
    case 'underline':
    case 'u':
      entityType = 'underline'
      break
    case 'strikethrough':
    case 's':
      entityType = 'strikethrough'
      break
    case 'code':
    case 'monospace':
      entityType = 'code'
      break
    case 'pre':
      entityType = 'pre'
      break
    case 'spoiler':
      entityType = 'spoiler'
      break
    case 'url':
    case 'link':
      entityType = 'text_link'
      break
    case 'emailaddress':
    case 'email':
      entityType = 'email'
      break
    case 'phonenumber':
    case 'phone':
      entityType = 'phone_number'
      break
    case 'bankcardnumber':
    case 'card':
      entityType = 'code'
      break
    case 'mention':
    case 'textmention':
      entityType = 'mention'
      break
    case 'hashtag':
      entityType = 'hashtag'
      break
    case 'cashtag':
      entityType = 'cashtag'
      break
    case 'botcommand':
    case 'command':
      entityType = 'bot_command'
      break
    case 'custom_emoji':
    case 'customemoji':
      entityType = 'custom_emoji'
      break
    case 'blockquote':
    case 'quote':
      entityType = 'blockquote'
      break
    case 'subscript':
    case 'superscript':
    case 'marked':
      entityType = 'italic'
      break
    default:
      break
  }

  if (entityType && length > 0) {
    const entity = { type: entityType, offset: startOffset, length }
    if (entityType === 'text_link' && richText.url) entity.url = richText.url
    if (entityType === 'custom_emoji' && (richText.custom_emoji_id || richText.document_id)) {
      entity.custom_emoji_id = richText.custom_emoji_id || richText.document_id
    }
    entities.push(entity)
  }

  return { text: nodeText, entities }
}

module.exports = {
  isRichTextPayload,
  parseRichTextToPlainAndEntities
}
