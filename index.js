const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs').promises;

const app = express();

app.use(express.static(__dirname));
app.use(bodyParser.text({ type: 'text/html', limit: '50mb' }));

app.post('/save', async (req, res) => {
  let { body } = req;
  let [fileName, data] = body.split(',');
  await fs.writeFile(__dirname + '/dataset/imgs/' + fileName, Buffer.from(data, 'base64'));
  res.send();
});

app.listen(8080, () => {
  console.log('Server opened.');
});