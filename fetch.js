const fetch = require('node-fetch').default;
const fs = require('fs');

const API_KEY = 'b8766ef4da51902dc6ba35f939e37956';
const TOTAL_PAGES = 20;

const TODAY = new Date().toISOString().split('T')[0];

// ===============================
// Categories
// ===============================
const categories = [
  { name: 'bollywood', media_type: 'movie', lang: 'hi' },
  { name: 'hollywood', media_type: 'movie', lang: 'en' },
  { name: 'south', media_type: 'movie', lang: 'te' },
  { name: 'gujarati', media_type: 'movie', lang: 'gu' },

  // ⭐ FIXED INDIAN OTT WEB SERIES
  {
    name: 'webseries',
    media_type: 'tv',
    providers: '8|119|337|121'
  }
];

// ===============================
function formatDate(dateStr) {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

function parseFormattedDate(dateStr) {
  if (!dateStr) return 0;
  const [d, m, y] = dateStr.split('/');
  return new Date(`${y}-${m}-${d}`);
}

function removeDuplicates(items) {
  const map = new Map();
  items.forEach(item => map.set(item.id, item));
  return Array.from(map.values());
}

// ===============================
// MAIN FETCH
// ===============================
async function fetchCategory(category) {
  let allItems = [];

  for (let page = 1; page <= TOTAL_PAGES; page++) {

    let url =
      `https://api.themoviedb.org/3/discover/${category.media_type}?` +
      `api_key=${API_KEY}` +
      `&include_adult=false` +
      `&page=${page}`;

    // ================= WEB SERIES =================
    if (category.name === 'webseries') {
      url +=
        `&watch_region=IN` +
        `&with_origin_country=IN` +
        `&with_watch_providers=${category.providers}` +
        `&sort_by=popularity.desc` +
        `&with_genres=18,80` +
        `&vote_count.gte=150`;
    }
    // ================= NORMAL MOVIES =================
    else {
      url +=
        `&sort_by=release_date.desc` +
        `&with_original_language=${category.lang}`;
    }

    try {
      const res = await fetch(url);
      const data = await res.json();

      if (!data.results) continue;

      const filtered = data.results
        .filter(item => {
          const release = item.release_date || item.first_air_date;

          if (category.name === 'hollywood') {
            return item.poster_path && item.overview;
          }

          return release && release <= TODAY && item.poster_path && item.overview;
        })
        .map(item => ({
          ...item,
          media_type: category.media_type,
          release_date: formatDate(item.release_date || item.first_air_date)
        }));

      allItems.push(...filtered);

    } catch (err) {
      console.log(`Error ${category.name} page ${page}`);
    }
  }

  allItems = removeDuplicates(allItems);

  allItems.sort(
    (a, b) => parseFormattedDate(b.release_date) - parseFormattedDate(a.release_date)
  );

  fs.writeFileSync(`${category.name}.json`, JSON.stringify(allItems, null, 2));
  console.log(`Saved ${allItems.length} ${category.name}`);
}

// ===============================
// UPCOMING BOLLYWOOD (FIXED)
// ===============================
async function fetchUpcomingBollywoodMovies() {
  let upcoming = [];

  for (let page = 1; page <= TOTAL_PAGES; page++) {

    const url =
      `https://api.themoviedb.org/3/discover/movie?` +
      `api_key=${API_KEY}` +
      `&with_original_language=hi` +
      `&include_adult=false` +
      `&release_date.gte=${TODAY}` +          // ✅ IMPORTANT
      `&sort_by=release_date.asc` +
      `&page=${page}`;

    try {
      const res = await fetch(url);
      const data = await res.json();

      if (!Array.isArray(data.results)) continue;

      const filtered = data.results
        .filter(movie =>
          movie.poster_path &&
          movie.overview &&
          movie.release_date &&
          movie.release_date >= TODAY          // ✅ DOUBLE SAFETY
        )
        .map(movie => ({
          ...movie,
          media_type: 'movie',
          release_date: formatDate(movie.release_date)
        }));

      upcoming.push(...filtered);

    } catch (err) {
      console.log('Upcoming error page', page);
    }
  }

  // 🔥 Remove duplicates
  upcoming = removeDuplicates(upcoming);

  // 🔥 FINAL CLEAN (old data auto removed)
  upcoming = upcoming.filter(movie => {
    const [d, m, y] = movie.release_date.split('/');
    return `${y}-${m}-${d}` >= TODAY;
  });

  fs.writeFileSync(
    'upcoming.json',
    JSON.stringify(upcoming, null, 2)
  );

  console.log(`✅ Saved ${upcoming.length} upcoming movies`);
}


// ===============================
async function fetchAll() {
  for (const cat of categories) {
    await fetchCategory(cat);
  }
  await fetchUpcomingBollywoodMovies();
}

fetchAll();
