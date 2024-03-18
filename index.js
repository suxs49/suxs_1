const express = require('express');
const bodyParser = require('body-parser');
const shortid = require('shortid');
const fs = require('fs').promises;
const hljs = require('highlight.js');

const app = express();
const PORT = process.env.PORT || 3000;
const dataDir = './paste-data/';

app.use(bodyParser.text()); 

app.use((req, res, next) => {
  res.highlight = (code, lang) => {
    const highlightedCode = hljs.highlight(lang || 'plaintext', code).value;
    return `<pre><code class="hljs ${lang || 'plaintext'}">${highlightedCode}</code></pre>`;
  };
  next();
});

fs.mkdir(dataDir, { recursive: true })
  .then(() => {
    console.log('Data directory created');
  })
  .catch((err) => {
    console.error('Error creating data directory:', err);
  });

app.get('/upload-paste', async (req, res) => {
  const { code } = req.query;

  if (!code) {
    res.status(400).send('ok');
    return;
  }

  const pasteId = shortid.generate();
  const filePath = `${dataDir}${pasteId}.txt`;

  try {
    await fs.writeFile(filePath, code, 'utf-8');
    const pasteUrl = `https://pastebin.xanxunder11.repl.co/pastes/raw/${pasteId}`;
    res.status(201).send({ url: pasteUrl });
  } catch (err) {
    console.error('Error saving paste:', err);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/pastes/raw/:id', async (req, res) => {
  const { id } = req.params;
  const filePath = `${dataDir}${id}.txt`;

  try {
    const pasteContent = await fs.readFile(filePath, 'utf-8');

    const contentWithoutLineNumbers = pasteContent.replace(/^\s*\d+\s*/gm, '');

    res.setHeader('Content-Type', 'text/plain');
    res.send(contentWithoutLineNumbers);
  } catch (err) {
    console.error('Error retrieving paste:', err);
    res.status(404).send('Paste not found');
  }
});

app.listen(PORT, () => {
  console.log(`RUBISH PASTE SERVER RUNING -> ${PORT}`);
});
