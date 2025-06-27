const fetch = require('node-fetch');
const fs = require('fs');
const cron = require('node-cron'); // Add this line for scheduling

const API_KEY = 'b8766ef4da51902dc6ba35f939e37956';
const TOTAL_PAGES = 5;

const categories = [
  { name: 'bollywood', lang: 'hi', media_type: 'movie' },
  { name: 'hollywood', lang: 'hi', media_type: 'movie' },
  { name: 'south', lang: 'hi', media_type: 'movie' },
  { name: 'webseries', lang: 'hi', media_type: 'tv' }
];

async function fetchCategory(category) {
  const allMovies = [];

  for (let page = 1; page <= TOTAL_PAGES; page++) {
    const url = `https://api.themoviedb.org/3/discover/${category.media_type}?` +
      `api_key=${API_KEY}` +
      `&language=en-US` +
      `&with_original_language=${category.lang}` +
      `&sort_by=popularity.desc` +
      `&include_adult=false` +
      `&page=${page}`;

    try {
      const res = await fetch(url);
      const data = await res.json();

      if (Array.isArray(data.results)) {
        const filtered = data.results.filter(movie =>
          movie.poster_path &&
          movie.poster_path.trim() !== '' &&
          movie.overview &&
          movie.overview.trim() !== ''
        );

        allMovies.push(...filtered);
      }
    } catch (err) {
      console.error(`❌ Error fetching page ${page} for ${category.name}: ${err.message}`);
    }
  }

  fs.writeFileSync(`${category.name}.json`, JSON.stringify(allMovies, null, 2));
  console.log(`✅ Saved ${allMovies.length} ${category.name} items to ${category.name}.json`);
}

async function fetchUpcomingMovies() {
  const allUpcoming = [];

  for (let page = 1; page <= TOTAL_PAGES; page++) {
    const url = `https://api.themoviedb.org/3/movie/upcoming?api_key=${API_KEY}&language=en-US&page=${page}`;
    try {
      const res = await fetch(url);
      const data = await res.json();

      if (Array.isArray(data.results)) {
        const filtered = data.results.filter(movie =>
          movie.poster_path &&
          movie.overview &&
          new Date(movie.release_date) > new Date()
        );
        allUpcoming.push(...filtered);
      }
    } catch (err) {
      console.error(`❌ Error fetching upcoming movies page ${page}: ${err.message}`);
    }
  }

  fs.writeFileSync(`upcoming.json`, JSON.stringify(allUpcoming, null, 2));
  console.log(`✅ Saved ${allUpcoming.length} movies to upcoming.json`);
}

async function fetchAll() {
  for (const cat of categories) {
    await fetchCategory(cat);
  }
  await fetchUpcomingMovies();
}

// ⏰ Run at 12:00 AM India time daily
cron.schedule('0 0 * * *', () => {
  console.log("🚀 Running daily update at midnight IST");
  fetchAll().catch(console.error);
}, {
  scheduled: true,
  timezone: "Asia/Kolkata"
});

// Run immediately on start
fetchAll().catch(console.error);
