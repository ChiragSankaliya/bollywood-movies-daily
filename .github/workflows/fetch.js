const fetch = require('node-fetch');
const fs = require('fs');

const API_KEY = 'b8766ef4da51902dc6ba35f939e37956';  // <-- Replace with your TMDb API key
const url = `https://api.themoviedb.org/3/discover/movie?api_key=${API_KEY}&with_original_language=hi&sort_by=popularity.desc`;

fetch(url)
  .then(res => res.json())
  .then(data => {
    fs.writeFileSync('movies.json', JSON.stringify(data.results, null, 2));
    console.log('Data saved to movies.json');
  })
  .catch(err => console.error(err));
