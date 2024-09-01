import { getSpotifyToken, getTopTracks, fetchAllAlbums, fetchBiography } from './artistInfoController.js';

import {
  connectKafkaProducer,
  sendTopTracksToKafka,
  disconnectKafkaProducer,
} from "../../../Kafka/apiKafkaTopTracks/controller/producer.js";

const getInfo = async (req, res) => {
  const artistName = req.query.artistName;

  try {
    await connectKafkaProducer();

    const token = await getSpotifyToken();

    const artistResponse = await fetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(
        artistName
      )}&type=artist`,
      {
        method: "GET",
        headers: { Authorization: "Bearer " + token },
      }
    );

    if (!artistResponse.ok) throw new Error("Falha ao coletar artista");

    const artistData = await artistResponse.json();
    const artist = artistData.artists.items[0];
    const artistId = artist.id;

    const albums = await fetchAllAlbums(artistId, token);

    const bioTranslated = await fetchBiography(artistName);

    const topTracks = await getTopTracks(artistId, token);

    await sendTopTracksToKafka(topTracks);

    res.json({
      artist: {
        profileImage: artist.images[0]
          ? artist.images[0].url
          : "Sem imagem de perfil",
        name: artist.name,
        genres: artist.genres,
        biography: bioTranslated,
        artistUrl: artist.external_urls.spotify,
      },
      albums,
      topTracks: topTracks.map((track) => ({
        name: track.name,
        album: track.album.name,
        preview_url: track.preview_url,
        image_url: track.album.images[0]?.url,
      })),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  } finally {
    await disconnectKafkaProducer();
  }
};

export default getInfo;
