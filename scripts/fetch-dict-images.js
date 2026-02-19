const fs = require('fs');
const path = require('path');

const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;
const DICT_PATH = path.join(__dirname, '..', 'data', 'dictionary.json');

// Delay between requests to stay under Unsplash rate limits (50/hour)
const DELAY_MS = 1500;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchImage(term) {
  const query = encodeURIComponent(`${term} watch`);
  const url = `https://api.unsplash.com/search/photos?query=${query}&per_page=1&orientation=landscape`;

  const res = await fetch(url, {
    headers: { Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}` },
  });

  if (!res.ok) {
    console.error(`  !! Unsplash API error for "${term}": ${res.status}`);
    return null;
  }

  const data = await res.json();
  if (data.results && data.results.length > 0) {
    return data.results[0].urls.small; // ~400px wide
  }
  return null;
}

async function main() {
  if (!UNSPLASH_ACCESS_KEY) {
    console.log('No UNSPLASH_ACCESS_KEY set — skipping image fetch.');
    console.log('Set it via: export UNSPLASH_ACCESS_KEY=your_key');
    process.exit(0);
  }

  const dictionary = JSON.parse(fs.readFileSync(DICT_PATH, 'utf-8'));
  let fetched = 0;
  let skipped = 0;

  for (const entry of dictionary) {
    // Skip if already has an image (caching)
    if (entry.image) {
      skipped++;
      continue;
    }

    console.log(`Fetching image for "${entry.term}"...`);
    const imageUrl = await fetchImage(entry.term);

    if (imageUrl) {
      entry.image = imageUrl;
      fetched++;
      console.log(`  -> OK`);
    } else {
      console.log(`  -> No result, using fallback`);
      // Fallback: generic watch image
      entry.image = 'https://images.unsplash.com/photo-1614164185128-e4ec99c436d7?w=400&q=80';
    }

    await sleep(DELAY_MS);
  }

  fs.writeFileSync(DICT_PATH, JSON.stringify(dictionary, null, 2));
  console.log(`\nDone. Fetched: ${fetched}, Skipped (cached): ${skipped}`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
