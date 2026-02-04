const fetch = require('node-fetch').default;
const fs = require('fs');

const API_KEY = 'b8766ef4da51902dc6ba35f939e37956';
const TOTAL_PAGES = 20;

// 📅 Today date (YYYY-MM-DD)
const TODAY = new Date().toISOString().split('T')[0];

// ✅ Categories
const categories = [
  { name: 'bollywood', lang: 'hi', media_type: 'movie' },
  { name: 'hollywood', lang: 'en', media_type: 'movie' },
  { name: 'south', lang: 'te', media_type: 'movie' },
  { name: 'webseries', media_type: 'tv', provider: '8', langs: ['hi', 'en'] }
];

// ===============================
// Format date as DD/MM/YYYY
// ===============================
function formatDate(dateStr) {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

// ===============================
// Convert DD/MM/YYYY → Date object
// ===============================
function parseFormattedDate(dateStr) {
  const [d, m, y] = dateStr.split('/');
  return new Date(`${y}-${m}-${d}`);
}

// ===============================
// Fetch movies by category
// ===============================
async function fetchCategory(category) {
  let allItems = [];

  for (let page = 1; page <= TOTAL_PAGES; page++) {
    let url =
      `https://api.themoviedb.org/3/discover/${category.media_type}?` +
      `api_key=${API_KEY}` +
      `&language=en-US` +
      `&sort_by=release_date.desc` +
      `&include_adult=false` +
      `&page=${page}`;

    // 🎯 Webseries filters
    if (category.name === 'webseries') {
      const langQuery = category.langs
        .map(l => `&with_original_language=${l}`)
        .join('');
      url += `&with_watch_providers=${category.provider}&watch_region=IN${langQuery}`;
    } else {
      url += `&with_original_language=${category.lang}`;
    }

    try {
      const res = await fetch(url);
      const data = await res.json();

      if (Array.isArray(data.results)) {
        const filtered = data.results
          // ✅ Only released movies (<= today)
          .filter(item => {
            const release =
              item.release_date || item.first_air_date;
            return (
              release &&
              release <= TODAY &&
              item.poster_path &&
              item.overview
            );
          })
          .map(item => ({
            ...item,
            release_date: formatDate(
              item.release_date || item.first_air_date
            )
          }));

        allItems.push(...filtered);
      }
    } catch (err) {
      console.error(`❌ ${category.name} page ${page}: ${err.message}`);
    }
  }

  // ===============================
  // 🔥 SORT: Latest date first
  // ===============================
  allItems.sort(
    (a, b) =>
      parseFormattedDate(b.release_date) -
      parseFormattedDate(a.release_date)
  );

  fs.writeFileSync(
    `${category.name}.json`,
    JSON.stringify(allItems, null, 2)
  );

  console.log(
    `✅ Saved ${allItems.length} ${category.name} items (latest first)`
  );
}

// ===============================
// Fetch upcoming Bollywood (unchanged logic, clean)
 // ===============================
async function fetchUpcomingBollywoodMovies() {
  let upcoming = [];

  for (let page = 1; page <= TOTAL_PAGES; page++) {
    const url =
      `https://api.themoviedb.org/3/discover/movie?` +
      `api_key=${API_KEY}` +
      `&language=en-US` +
      `&with_original_language=hi` +
      `&sort_by=release_date.asc` +
      `&include_adult=false` +
      `&release_date.gte=${TODAY}` +
      `&page=${page}`;

    try {
      const res = await fetch(url);
      const data = await res.json();

      if (Array.isArray(data.results)) {
        const filtered = data.results
          .filter(movie =>
            movie.poster_path &&
            movie.overview &&
            movie.release_date
          )
          .map(movie => ({
            ...movie,
            release_date: formatDate(movie.release_date)
          }));

        upcoming.push(...filtered);
      }
    } catch (err) {
      console.error(`❌ Upcoming page ${page}: ${err.message}`);
    }
  }

  fs.writeFileSync(
    `upcoming.json`,
    JSON.stringify(upcoming, null, 2)
  );

  console.log(
    `✅ Saved ${upcoming.length} upcoming Bollywood movies`
  );
}

// ===============================
// RUN ALL
// ===============================
async function fetchAll() {
  for (const cat of categories) {
    await fetchCategory(cat);
  }
  await fetchUpcomingBollywoodMovies();
}

fetchAll().catch(console.error);
