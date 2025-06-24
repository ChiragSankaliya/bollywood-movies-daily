const fetch = require('node-fetch');
const fs = require('fs');

// Your TMDB API Key
const API_KEY = 'b8766ef4da51902dc6ba35f939e37956';  // Replace with your TMDB API Key
const TOTAL_PAGES = 10; // You can increase pages if needed

// Category configurations
const categories = [
  {
    name: 'bollywood',
    language: 'hi',
    region: 'IN',
    filename: 'bollywood.json'
  },
  {
    name: 'hollywood',
    language: 'en',
    region: 'US',
    filename: 'hollywood.json'
  },
  {
    name: 'south',
    language: 'te', // Telugu (for Tamil use 'ta', Malayalam use 'ml')
    region: 'IN',
    filename: 'south.json'
  }
];

async function fetchMoviesForCategory(category) {
  const allMovies = [];

  for (let page = 1; page <= TOTAL_PAGES; page++) {
    const url = `https://api.themoviedb.org/3/discover/movie?api_key=${API_KEY}&with_original_language=${category.language}&region=${category.region}&include_adult=false&sort_by=release_date.desc&page=${page}`;

    try {
      const res = await fetch(url);
      const data = await res.json();
      if (data.results) {
        allMovies.push(...data.results);
      }
    } catch (error) {
      console.error(`❌ Error fetching page ${page} for ${category.name}:`, error.message);
    }
  }

  fs.writeFileSync(category.filename, JSON.stringify(allMovies, null, 2));
  console.log(`✅ Saved ${category.name} movies to ${category.filename}`);
}

async function fetchAllCategories() {
  for (const category of categories) {
    await fetchMoviesForCategory(category);
  }
}

fetchAllCategories().catch(console.error);
