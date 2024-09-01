
import fetch from "node-fetch";
import axios from "axios";
import translate from "translate-google";
import { Buffer } from "buffer";
import dotenv from "dotenv";

dotenv.config();

const client_id = process.env.CLIENT_ID;
const client_secret = process.env.CLIENT_SECRET;
const lastfm_api_key = process.env.LASTFM_API_KEY;

async function getSpotifyToken() {
  try {
    const response = await fetch(
      "https://accounts.spotify.com/api/token",
      {
        method: "POST",
        body: new URLSearchParams({ grant_type: "client_credentials" }),
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Authorization": "Basic " + Buffer.from(client_id + ":" + client_secret).toString("base64"),
        },
      }
    );

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = await response.json();
    return data.access_token;
  } catch (error) {
    console.error('Erro ao coletar Spotify token:', error.message);
    throw error;
  }
}

async function getTopTracks(artistId, token) {
  try {
    const response = await axios.get(`https://api.spotify.com/v1/artists/${artistId}/top-tracks`, {
      params: { market: 'US' },
      headers: { 'Authorization': `Bearer ${token}` }
    });

    return response.data.tracks.slice(0, 10);
  } catch (error) {
    console.error('Erro ao coletar top tracks:', error.message);
    throw error;
  }
}

async function fetchAllAlbums(artistId, token) {
  let albums = [];
  let offset = 0;
  let limit = 50;
  let hasMore = true;

  while (hasMore) {
    const response = await fetch(
      `https://api.spotify.com/v1/artists/${artistId}/albums?include_groups=album,single&limit=${limit}&offset=${offset}`,
      {
        method: "GET",
        headers: { Authorization: "Bearer " + token },
      }
    );

    if (!response.ok) throw new Error("Falha ao coletar albums");

    const albumsData = await response.json();
    albums = albums.concat(
      albumsData.items.map((album) => ({
        name: album.name,
        release_date: album.release_date,
        coverImage: album.images[0] ? album.images[0].url : "Sem capa disponível",
        url: album.external_urls.spotify,
      }))
    );

    offset += limit;
    hasMore = albumsData.items.length === limit;
  }

  return albums;
}

async function fetchBiography(artistName) {
  try {
    const response = await fetch(
      `https://ws.audioscrobbler.com/2.0/?method=artist.getinfo&artist=${encodeURIComponent(artistName)}&api_key=${lastfm_api_key}&format=json`
    );

    if (!response.ok) throw new Error("Falha ao coletar biografia no Last.fm");

    const data = await response.json();
    const biography =
      data.artist &&
      data.artist.bio &&
      data.artist.bio.content
        ? data.artist.bio.content
        : "Sem biografia disponível";

    const firstParagraph = biography.split("\n\n")[0];
    return await translate(firstParagraph, { to: "pt" });
  } catch (error) {
    console.error('Erro ao coletar biografia:', error.message);
    throw error;
  }
}

export { getSpotifyToken, getTopTracks, fetchAllAlbums, fetchBiography };
