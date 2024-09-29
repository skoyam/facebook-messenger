require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const request = require('request'); // Move this up with other imports
const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Root route
app.get('/', (req, res) => {
  res.send('Webhook server is running!');
});

app.get('/webhook', (req, res) => {
  console.log('Webhook GET request received');
  
  const expectedChallenge = req.query['hub.challenge']; // This is the expected challenge
  const verifyToken = req.query['hub.verify_token'];

  if (req.query['hub.mode'] && verifyToken === 'tuxedo_cat') {
    console.log('Verification token matched');
    console.log(`Expected challenge: ${expectedChallenge}`);  // Log the expected challenge
    res.status(200).send(expectedChallenge);  // Respond with the challenge value
  } else {
    console.log('Verification token mismatch');
    res.status(403).end();  // Respond with 403 if the token doesn't match
  }
});

// Handling all messages
app.post('/webhook', (req, res) => {
  console.log(req.body);
  if (req.body.object === 'page') {
    req.body.entry.forEach((entry) => {
      entry.messaging.forEach((event) => {
        if (event.message && event.message.text) {
          sendMessage(event); // Call sendMessage
        }
      });
    });
    res.status(200).end();
  }
});

function sendMessage(event) {
  let sender = event.sender.id;
  let text = event.message.text;

  request({
    url: 'https://graph.facebook.com/v2.6/me/messages',
    qs: { access_token: process.env.PAGE_ACCESS_TOKEN }, // Ensure you set this in your environment
    method: 'POST',
    json: {
      recipient: { id: sender },
      message: { text: text }
    }
  }, function (error, response) {
    if (error) {
      console.log('Error sending message: ', error);
    } else if (response.body.error) {
      console.log('Error: ', response.body.error);
    }
  });
}


// Start the server
const server = app.listen(process.env.PORT || 3000, () => {
  console.log('Express server listening on port %d in %s mode', server.address().port, app.settings.env);
});
