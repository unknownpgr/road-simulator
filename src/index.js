const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs').promises;
const { join } = require('path');

const RAWDATA_ROOT = join(__dirname, 'rawdata');
const SAVE_PATH = join(RAWDATA_ROOT, Date.now() + '');

async function main() {
  try {
    await fs.stat(SAVE_PATH);
  } catch {
    await fs.mkdir(SAVE_PATH);
  }

  const app = express();

  app.use(express.static(join(__dirname, 'public')));
  app.use(bodyParser.text({ type: 'text/html', limit: '50mb' }));

  app.post('/save', async (req, res) => {
    let { body } = req;
    let [fileName, data] = body.split(',');
    await fs.writeFile(join(SAVE_PATH, fileName), Buffer.from(data, 'base64'));
    res.send();
  });

  app.listen(8080, () => {
    console.log('Server opened at port 8080.');
  });
}

main();