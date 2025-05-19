const fetch = require('node-fetch');
const fs = require('fs');

const API_KEY = 'b8766ef4da51902dc6ba35f939e37956';  // Replace with your real key
const TOTAL_PAGES = 5; // You can change this to any number of pages

const allMovies = [];

async function fetchAllPages() {
  for (let page = 1; page <= TOTAL_PAGES; page++) {
    const url = `https://api.themoviedb.org/3/discover/movie?api_key=${API_KEY}&page=${page}`;
    const res = await fetch(url);
    const data = await res.json();
    allMovies.push(...data.results);
  }

  fs.writeFileSync('movies.json', JSON.stringify(allMovies, null, 2));
  console.log('Saved all movies to movies.json');
}

fetchAllPages().catch(console.error);
