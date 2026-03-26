const express = require('express');
const { google } = require('googleapis');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.static(__dirname));

app.get('/', (req, res) => {
  res.sendFile('dashboard.html', { root: __dirname });
});

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = 'https://ndk-dashboard.onrender.com/callback';

const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

// STEP 1: Login
app.get('/auth', (req, res) => {
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/webmasters.readonly'],
  });
  res.redirect(url);
});

// 🔥 THIS IS WHAT YOU WERE MISSING
// STEP 2: Callback (Google returns here)
app.get('/callback', async (req, res) => {
  try {
    const { code } = req.query;

    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    res.send('✅ Connected! You can close this tab and go back.');
  } catch (err) {
    res.send('Error: ' + err.message);
  }
});

// STEP 3: Get Data
app.get('/data', async (req, res) => {
  try {
    const searchconsole = google.searchconsole({
      version: 'v1',
      auth: oauth2Client,
    });

    const response = await searchconsole.searchanalytics.query({
      siteUrl: 'https://www.ndkphotography.co.uk/',
      requestBody: {
        startDate: '2026-02-01',
        endDate: '2026-03-01',
        dimensions: ['query'],
        rowLimit: 10
      },
    });

    res.json(response.data);
  } catch (err) {
    res.json({ error: err.message });
  }
});

app.listen(3000, () =>
  console.log('Open http://localhost:3000/auth to connect Google')

);
