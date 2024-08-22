document.getElementById('artist-form').addEventListener('submit', async (e) => {
    e.preventDefault();
  
    const artistName = document.getElementById('artist-name').value;
    const response = await fetch('/api/getAlbums?artistName=' + encodeURIComponent(artistName));
    const data = await response.json();
  
    const albumsList = document.getElementById('albums-list');
    albumsList.innerHTML = '';
  
    data.albums.forEach(album => {
      const albumElement = document.createElement('div');
      albumElement.classList.add('album');
  
      albumElement.innerHTML = `
        <h2>${album.name}</h2>
        <p>Release Date: ${album.release_date}</p>
        <img src="${album.coverImage}" alt="${album.name} cover">
      `;
  
      albumsList.appendChild(albumElement);
    });
  });
  