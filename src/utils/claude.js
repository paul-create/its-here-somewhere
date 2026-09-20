const Anthropic = require('@anthropic-ai/sdk');

const client = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY
});

async function tagPhoto(imageDataUrl) {
  // Extract base64 from data URL
  const base64Data = imageDataUrl.split(',')[1];
  const mediaType = imageDataUrl.match(/data:image\/([^;]+)/)?.[1] || 'jpeg';
  
  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 100,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: `image/${mediaType}`,
              data: base64Data
            }
          },
          {
            type: 'text',
            text: 'Generate 3-5 short descriptive tags for this household item. Return only comma-separated tags, no explanations.'
          }
        ]
      }
    ]
  });

  const tagsText = message.content[0].text;
  const tags = tagsText.split(',').map(tag => tag.trim());
  return tags;
}

module.exports = { tagPhoto };