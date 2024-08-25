import fetch from "node-fetch";
import { Buffer } from "buffer";
import dotenv from "dotenv";
import translate from "translate-google";
dotenv.config();

const client_id = process.env.CLIENT_ID;
const client_secret = process.env.CLIENT_SECRET;
const lastfm_api_key = process.env.LASTFM_API_KEY;

const getInfo = async (req, res) => {
  const artistName = req.query.artistName;

  try {
    // Obtenha o token do Spotify
    const tokenResponse = await fetch(
      "https://accounts.spotify.com/api/token",
      {
        method: "POST",
        body: new URLSearchParams({ grant_type: "client_credentials" }),
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization:
            "Basic " +
            Buffer.from(client_id + ":" + client_secret).toString("base64"),
        },
      }
    );

    if (!tokenResponse.ok) throw new Error("Failed to fetch token");

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // Busque informações do artista no Spotify
    const artistResponse = await fetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(
        artistName
      )}&type=artist`,
      {
        method: "GET",
        headers: { Authorization: "Bearer " + accessToken },
      }
    );

    if (!artistResponse.ok) throw new Error("Failed to fetch artist");

    const artistData = await artistResponse.json();
    const artist = artistData.artists.items[0];
    const artistId = artist.id;

    // Busque os álbuns do artista no Spotify
    const albumsResponse = await fetch(
      `https://api.spotify.com/v1/artists/${artistId}/albums`,
      {
        method: "GET",
        headers: { Authorization: "Bearer " + accessToken },
      }
    );

    if (!albumsResponse.ok) throw new Error("Failed to fetch albums");

    const albumsData = await albumsResponse.json();

    const albums = albumsData.items.map((album) => ({
      name: album.name,
      release_date: album.release_date,
      coverImage: album.images[0] ? album.images[0].url : "No cover available",
      url: album.external_urls.spotify,
    }));

    // Busque a biografia do artista no Last.fm
    const lastfmResponse = await fetch(
      `https://ws.audioscrobbler.com/2.0/?method=artist.getinfo&artist=${encodeURIComponent(
        artistName
      )}&api_key=${lastfm_api_key}&format=json`
    );

    if (!lastfmResponse.ok) throw new Error("Failed to fetch biography from Last.fm");

    const lastfmData = await lastfmResponse.json();
    const biography = lastfmData.artist && lastfmData.artist.bio && lastfmData.artist.bio.content
      ? lastfmData.artist.bio.content
      : "No biography available";

    const firstParagraph = biography.split('\n\n')[0];
    const bioTranslated = await translate(firstParagraph, { to: 'pt' })
    res.json({
      artist: {
        profileImage: artist.images[0] ? artist.images[0].url : "No profile image available",
        name: artist.name,
        genres: artist.genres,
        biography: bioTranslated,
        artistUrl: artist.external_urls.spotify,
      },
      albums,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export default getInfo;
