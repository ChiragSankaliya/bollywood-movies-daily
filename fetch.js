const fetch = require('node-fetch');
const fs = require('fs');

const API_KEY = 'b8766ef4da51902dc6ba35f939e37956'; // Replace with your TMDB key
const TOTAL_PAGES = 5; // Adjust as needed

// Language and category mappings
const categories = [
  { name: 'bollywood', lang: 'hi' },
  { name: 'hollywood', lang: 'en' },
  { name: 'south', lang: 'te' },
  { name: 'webseries', media_type: 'tv', lang: 'hi' } // Hindi Web Series
];

async function fetchCategory(category) {
  const allMovies = [];

  for (let page = 1; page <= TOTAL_PAGES; page++) {
    const url = category.media_type === 'tv'
      ? `https://api.themoviedb.org/3/discover/tv?api_key=${API_KEY}&language=en-US&with_original_language=${category.lang}&sort_by=first_air_date.desc&include_adult=false&page=${page}`
      : `https://api.themoviedb.org/3/discover/movie?api_key=${API_KEY}&language=en-US&with_original_language=${category.lang}&sort_by=release_date.desc&include_adult=false&page=${page}`;

    try {
      const res = await fetch(url);
      const data = await res.json();

      if (Array.isArray(data.results)) {
        const filtered = data.results.filter(movie => movie.poster_path && movie.poster_path.trim() !== '');
        allMovies.push(...filtered);
      }
    } catch (err) {
      console.error(`❌ Error fetching page ${page} for ${category.name}: ${err.message}`);
    }
  }

  fs.writeFileSync(`${category.name}.json`, JSON.stringify(allMovies, null, 2));
  console.log(`✅ Saved ${allMovies.length} ${category.name} movies to ${category.name}.json`);
}

async function fetchAll() {
  for (const cat of categories) {
    await fetchCategory(cat);
  }
}

fetchAll().catch(console.error);
