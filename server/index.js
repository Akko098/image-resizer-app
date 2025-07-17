
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const sharp = require('sharp');
const JSZip = require('jszip');

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

app.post('/api/resize', upload.array('images'), async (req, res) => {
  try {
    const { widths } = req.body;
    const imageFiles = req.files;

    if (!widths || !imageFiles || imageFiles.length === 0) {
      return res.status(400).send('Missing parameters.');
    }

    const parsedWidths = JSON.parse(widths);
    const zip = new JSZip();

    for (const imageFile of imageFiles) {
      const originalName = imageFile.originalname.split('.').slice(0, -1).join('.');
      for (const width of parsedWidths) {
        const resizedImageBuffer = await sharp(imageFile.buffer)
          .resize({ width: parseInt(width, 10) })
          .toBuffer();
        
        zip.file(`${originalName}-${width}.png`, resizedImageBuffer);
      }
    }

    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });

    res.set({
      'Content-Type': 'application/zip',
      'Content-Disposition': 'attachment; filename=resized-images.zip'
    });

    res.send(zipBuffer);

  } catch (error) {
    console.error(error);
    res.status(500).send('Error processing images.');
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
