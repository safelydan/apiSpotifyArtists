import { getSpotifyToken, getTopTracks, fetchAllAlbums, fetchBiography } from './controllers/artistInfoController.js';
import { connectKafkaProducer, sendTopTracksToKafka, disconnectKafkaProducer } from '../../apiKafkaTopTracks/src/controller/producerEmail.js';
import getInfo from './controllers/getInfo.js'; // Substitua pelo caminho correto

jest.mock('./artistInfoController');
jest.mock('./producer');

describe('getInfo API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should return artist info and albums', async () => {
    // Mocks para as funções importadas
    const mockToken = 'mockToken';
    const mockArtistId = 'mockArtistId';
    const mockArtistData = {
      artists: {
        items: [
          {
            id: mockArtistId,
            name: 'Mock Artist',
            genres: ['rock'],
            images: [{ url: 'mockImageUrl' }],
            external_urls: { spotify: 'mockArtistUrl' }
          }
        ]
      }
    };
    const mockAlbums = [{ name: 'Mock Album', release_date: '2024-01-01' }];
    const mockBio = 'Mock biography translated';
    const mockTopTracks = [{ name: 'Mock Track', album: { name: 'Mock Album', images: [{ url: 'mockTrackImageUrl' }] } }];

    getSpotifyToken.mockResolvedValue(mockToken);
    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockArtistData)
    });
    fetchAllAlbums.mockResolvedValue(mockAlbums);
    fetchBiography.mockResolvedValue(mockBio);
    getTopTracks.mockResolvedValue(mockTopTracks);
    sendTopTracksToKafka.mockResolvedValue(undefined);

    const req = { query: { artistName: 'Mock Artist' } };
    const res = {
      json: jest.fn(),
      status: jest.fn(() => res)
    };

    await getInfo(req, res);

    expect(getSpotifyToken).toHaveBeenCalled();
    expect(fetchAllAlbums).toHaveBeenCalledWith(mockArtistId, mockToken);
    expect(fetchBiography).toHaveBeenCalledWith('Mock Artist');
    expect(getTopTracks).toHaveBeenCalledWith(mockArtistId, mockToken);
    expect(sendTopTracksToKafka).toHaveBeenCalledWith(mockTopTracks);
    expect(res.json).toHaveBeenCalledWith({
      artist: {
        profileImage: 'mockImageUrl',
        name: 'Mock Artist',
        genres: ['rock'],
        biography: 'Mock biography translated',
        artistUrl: 'mockArtistUrl'
      },
      albums: mockAlbums,
      topTracks: [
        {
          name: 'Mock Track',
          album: 'Mock Album',
          preview_url: undefined,
          image_url: 'mockTrackImageUrl'
        }
      ]
    });
  });

  test('should handle errors gracefully', async () => {
    getSpotifyToken.mockRejectedValue(new Error('Spotify token error'));

    const req = { query: { artistName: 'Mock Artist' } };
    const res = {
      json: jest.fn(),
      status: jest.fn(() => res)
    };

    await getInfo(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Spotify token error' });
  });
});
