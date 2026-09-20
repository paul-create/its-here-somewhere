const path = require('path');
const fs = require('fs');

function getImageDataUrl(filename) {
  const filepath = path.join(__dirname, 'images', filename);
  const imageBuffer = fs.readFileSync(filepath);
  const base64 = imageBuffer.toString('base64');
  const ext = path.extname(filename).slice(1);
  return `data:image/${ext};base64,${base64}`;
}

module.exports = {
  items: [
    {
      name: 'hammer',
      imageFile: 'hammer.jpeg',
      expectedTags: ['hammer', 'tool', 'metal']
    },
    {
      name: 'coffee-mug',
      imageFile: 'coffee-mug.jpeg',
      expectedTags: ['mug', 'coffee', 'cup']
    },
    {
      name: 'shoes',
      imageFile: 'shoes.jpeg',
      expectedTags: ['shoes', 'footwear', 'sneakers']
    },
    {
      name: 'lamp',
      imageFile: 'lamp.jpeg',
      expectedTags: ['lamp', 'light', 'furniture']
    },
    {
      name: 'book',
      imageFile: 'book.jpeg',
      expectedTags: ['book', 'reading', 'pages']
    },
    {
      name: 'scissors',
      imageFile: 'scissors.jpeg',
      expectedTags: ['scissors', 'tool', 'metal']
    },
    {
      name: 'plant',
      imageFile: 'plant.jpeg',
      expectedTags: ['plant', 'green', 'leaves']
    }
  ],
  getImageDataUrl
};