require('dotenv').config();
const Anthropic = require('@anthropic-ai/sdk');

async function tagPhoto(imageDataUrl, mimeType = 'image/jpeg') {
  try {
    const apiKey = process.env.CLAUDE_API_KEY;
    
    if (!apiKey) {
      throw new Error('CLAUDE_API_KEY environment variable not set');
    }

    const client = new Anthropic({
      apiKey: apiKey
    });

    if (!imageDataUrl) {
      console.error('imageDataUrl is undefined or null');
      throw new Error('imageDataUrl required');
    }

    const parts = imageDataUrl.split(',');
    if (parts.length < 2) {
      console.error('Invalid data URL format:', imageDataUrl.substring(0, 50));
      throw new Error('Invalid data URL format - must contain comma');
    }

    const base64Data = parts[1];
    
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
                media_type: mimeType,
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

    if (!message.content || message.content.length === 0) {
      console.error('Empty response from Claude:', message);
      return [];
    }

    const tagsText = message.content[0].text;
    if (!tagsText) {
      console.error('No text in Claude response:', message.content[0]);
      return [];
    }

    const tags = tagsText.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
    return tags;
  } catch (err) {
    console.error('Error tagging photo:', err);
    throw err;
  }
}

module.exports = { tagPhoto };