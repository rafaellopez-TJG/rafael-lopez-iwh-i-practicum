require('dotenv').config();

const express = require('express');
const axios = require('axios');
const path = require('path');
const app = express();

const PORT = process.env.PORT || 3000;

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Keep these in .env, not in GitHub
const PRIVATE_APP_ACCESS = process.env.HUBSPOT_ACCESS_TOKEN;
const HUBSPOT_OBJECT_TYPE = process.env.HUBSPOT_OBJECT_TYPE;

// Use the internal property names from your Pets object
const customObjectProperties = [
  { name: 'name', label: 'Name' },
  { name: 'species', label: 'Species' },
  { name: 'favorite_toy', label: 'Favorite Toy' }
];

if (!PRIVATE_APP_ACCESS || !HUBSPOT_OBJECT_TYPE) {
  console.error('Missing HUBSPOT_ACCESS_TOKEN or HUBSPOT_OBJECT_TYPE in .env');
  process.exit(1);
}

const headers = {
  Authorization: `Bearer ${PRIVATE_APP_ACCESS}`,
  'Content-Type': 'application/json'
};

// ROUTE 1 - Homepage
app.get('/', async (req, res) => {
  const endpoint = `https://api.hubapi.com/crm/v3/objects/${HUBSPOT_OBJECT_TYPE}`;

  try {
    const resp = await axios.get(endpoint, {
      headers,
      params: {
        limit: 100,
        properties: customObjectProperties.map(p => p.name).join(',')
      }
    });

    const data = resp.data.results || [];

    res.render('homepage', {
      title: 'Homepage | Integrating With HubSpot I Practicum',
      records: data,
      customObjectProperties
    });
  } catch (error) {
    console.error('Error fetching custom object records:', error.response?.data || error.message);
    res.status(500).send('Error retrieving custom object records.');
  }
});

// ROUTE 2 - Form page
app.get('/update-cobj', (req, res) => {
  res.render('updates', {
    title: 'Update Custom Object Form | Integrating With HubSpot I Practicum',
    customObjectProperties
  });
});

// ROUTE 3 - Form submission
app.post('/update-cobj', async (req, res) => {
  const endpoint = `https://api.hubapi.com/crm/v3/objects/${HUBSPOT_OBJECT_TYPE}`;

  const newRecord = {
    properties: {
      name: req.body.name,
      species: req.body.species,
      favorite_toy: req.body.favorite_toy
    }
  };

  try {
    await axios.post(endpoint, newRecord, { headers });
    res.redirect('/');
  } catch (error) {
    console.error('Error creating custom object record:', error.response?.data || error.message);
    res.status(500).send('Error creating custom object record.');
  }
});

// Localhost
app.listen(PORT, () => console.log(`Listening on http://localhost:${PORT}`));
