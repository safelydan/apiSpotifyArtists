const express = require('express');
const fetch = require('node-fetch');
const { Buffer } = require('buffer');

const app = express();
const port = 3000;

const client_id = 'ec15723b27e64972ac2bd688d71b2380'; 
const client_secret = 'f9170e1cc81146e5853096160963278d';

app.get('/api/getAlbums', async (req, res) => {
  const artistName = req.query.artistName;

  try {
    // Get access token
    const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      body: new URLSearchParams({ 'grant_type': 'client_credentials' }),
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + (Buffer.from(client_id + ':' + client_secret).toString('base64')),
      },
    });

    if (!tokenResponse.ok) throw new Error('Failed to fetch token');

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // Search artist
    const artistResponse = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(artistName)}&type=artist`, {
      method: 'GET',
      headers: { 'Authorization': 'Bearer ' + accessToken },
    });

    if (!artistResponse.ok) throw new Error('Failed to fetch artist');

    const artistData = await artistResponse.json();
    const artistId = artistData.artists.items[0].id;

    // Get albums
    const albumsResponse = await fetch(`https://api.spotify.com/v1/artists/${artistId}/albums`, {
      method: 'GET',
      headers: { 'Authorization': 'Bearer ' + accessToken },
    });

    if (!albumsResponse.ok) throw new Error('Failed to fetch albums');

    const albumsData = await albumsResponse.json();

    const albums = albumsData.items.map(album => ({
      name: album.name,
      release_date: album.release_date,
      coverImage: album.images[0] ? album.images[0].url : 'No cover available',
    }));

    res.json({ albums });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
