const fetch = require('node-fetch').default;
const fs = require('fs');

const API_KEY = 'b8766ef4da51902dc6ba35f939e37956';
const TOTAL_PAGES = 20;

// ✅ Categories including Netflix web series (hi/en only)
const categories = [
  { name: 'bollywood', lang: 'hi', media_type: 'movie' },
  { name: 'hollywood', lang: 'en', media_type: 'movie' },
  { name: 'south', lang: 'te', media_type: 'movie' },
  { name: 'webseries', media_type: 'tv', provider: '8', langs: ['hi', 'en'] } // Netflix India
];

// ✅ Format date as DD/MM/YYYY
function formatDate(dateStr) {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

// ✅ Fetch by category
async function fetchCategory(category) {
  const allItems = [];

  for (let page = 1; page <= TOTAL_PAGES; page++) {
    let url = `https://api.themoviedb.org/3/discover/${category.media_type}?` +
      `api_key=${API_KEY}` +
      `&language=en-US` +
      `&sort_by=popularity.desc` +
      `&include_adult=false` +
      `&page=${page}`;

    // 👉 Extra filters for webseries
    if (category.name === 'webseries') {
      const langQuery = category.langs.map(l => `&with_original_language=${l}`).join('');
      url += `&with_watch_providers=${category.provider}&watch_region=IN${langQuery}`;
    } else {
      url += `&with_original_language=${category.lang}`;
    }

    try {
      const res = await fetch(url);
      const data = await res.json();

      if (Array.isArray(data.results)) {
        const filtered = data.results.filter(item =>
          item.poster_path &&
          item.poster_path.trim() !== '' &&
          item.overview &&
          item.overview.trim() !== ''
        ).map(item => ({
          ...item,
          release_date: formatDate(item.release_date || item.first_air_date || '') // 🎯 format for all categories
        }));

        allItems.push(...filtered);
      }
    } catch (err) {
      console.error(`❌ Error fetching page ${page} for ${category.name}: ${err.message}`);
    }
  }

  fs.writeFileSync(`${category.name}.json`, JSON.stringify(allItems, null, 2));
  console.log(`✅ Saved ${allItems.length} ${category.name} items to ${category.name}.json`);
}

// ✅ Fetch upcoming Bollywood movies
async function fetchUpcomingBollywoodMovies() {
  const allUpcoming = [];
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  for (let page = 1; page <= TOTAL_PAGES; page++) {
    const url = `https://api.themoviedb.org/3/discover/movie?` +
      `api_key=${API_KEY}` +
      `&language=en-US` +
      `&with_original_language=hi` +
      `&sort_by=release_date.asc` +
      `&include_adult=false` +
      `&release_date.gte=${today}` +
      `&page=${page}`;

    try {
      const res = await fetch(url);
      const data = await res.json();

      if (Array.isArray(data.results)) {
        const filtered = data.results.filter(movie =>
          movie.poster_path &&
          movie.overview &&
          movie.release_date &&
          new Date(movie.release_date) > new Date()
        ).map(movie => ({
          ...movie,
          release_date: formatDate(movie.release_date)
        }));

        allUpcoming.push(...filtered);
      }
    } catch (err) {
      console.error(`❌ Error fetching upcoming Bollywood movies page ${page}: ${err.message}`);
    }
  }

  fs.writeFileSync(`upcoming.json`, JSON.stringify(allUpcoming, null, 2));
  console.log(`✅ Saved ${allUpcoming.length} upcoming Bollywood movies to upcoming.json`);
}

// ✅ Run all fetches
async function fetchAll() {
  for (const cat of categories) {
    await fetchCategory(cat);
  }
  await fetchUpcomingBollywoodMovies();
}

// ▶️ Manual Run
fetchAll().catch(console.error);
