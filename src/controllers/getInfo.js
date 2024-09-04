import {
  getSpotifyToken,
  getTopTracks,
  fetchAllAlbums,
  fetchBiography,
} from "./artistInfoController.js";
import {
  connectKafkaProducer,
  sendTopTracksToKafka,
  disconnectKafkaProducer,
} from "../../../apiKafkaTopTracks/src/controller/producer.js";

import sendEmailForNewReleases from "./emailController.js";

import { sendNewReleasesToKafka } from "../../../apiKafkaTopTracks/src/controller/emailProducer.js";

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

    // Coletar álbuns e faixas
    const albums = await fetchAllAlbums(artistId, token);
    const bioTranslated = await fetchBiography(artistName);
    const topTracks = await getTopTracks(artistId, token);

    // Criar objeto para novos lançamentos
    const newReleases = {
      artist: artist.name,
      albums: albums,
      topTracks: topTracks.map((track) => ({
        name: track.name,
        album: track.album.name,
        preview_url: track.preview_url,
        image_url: track.album.images[0]?.url,
      })),
    };

    // Enviar faixas e novos lançamentos para o Kafka
    await sendTopTracksToKafka(topTracks);
    await sendNewReleasesToKafka(newReleases);

    // Enviar e-mail sobre novos lançamentos
    await sendEmailForNewReleases(newReleases);

    // Retornar resposta para o cliente
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
    // Desconectar do Kafka Producer
    await disconnectKafkaProducer();
  }
};

export default getInfo;
