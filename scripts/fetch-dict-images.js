const fs = require('fs');
const path = require('path');

const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;
const DICT_PATH = path.join(__dirname, '..', 'data', 'dictionary.json');

const BATCH_SIZE = 45;           // Stay safely under 50/hour limit
const BATCH_PAUSE_MS = 65 * 60 * 1000; // 65 minutes between batches
const DELAY_MS = 1500;           // 1.5s between individual requests

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function formatTime(ms) {
  const mins = Math.round(ms / 60000);
  return mins >= 60 ? `${Math.floor(mins/60)}h ${mins%60}m` : `${mins}m`;
}

async function fetchImage(term) {
  const query = encodeURIComponent(`${term} watch`);
  const url = `https://api.unsplash.com/search/photos?query=${query}&per_page=1&orientation=landscape`;

  const res = await fetch(url, {
    headers: { Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}` },
  });

  // Rate limited — return a signal to pause
  if (res.status === 403 || res.status === 429) {
    console.log(`  !! Rate limited (${res.status}). Will pause and retry.`);
    return 'RATE_LIMITED';
  }

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

  // Collect entries that still need images
  const needsImage = dictionary.filter(e => !e.image);
  const total = needsImage.length;

  if (total === 0) {
    console.log('All dictionary terms already have images (cached). Nothing to fetch.');
    return;
  }

  const batches = Math.ceil(total / BATCH_SIZE);
  console.log(`Need to fetch ${total} images in ${batches} batch(es) of up to ${BATCH_SIZE}.`);
  if (batches > 1) {
    console.log(`Estimated total time: ~${formatTime((batches - 1) * BATCH_PAUSE_MS)}`);
  }

  let fetched = 0;
  let batchCount = 0;
  let requestsInBatch = 0;

  for (const entry of needsImage) {
    // Check if we need to pause for rate limit
    if (requestsInBatch >= BATCH_SIZE) {
      batchCount++;
      // Save progress so far
      fs.writeFileSync(DICT_PATH, JSON.stringify(dictionary, null, 2));
      console.log(`\n--- Batch ${batchCount} complete (${fetched} images so far). Saved progress.`);
      console.log(`--- Pausing ${formatTime(BATCH_PAUSE_MS)} to respect rate limit...`);
      await sleep(BATCH_PAUSE_MS);
      console.log(`--- Resuming...\n`);
      requestsInBatch = 0;
    }

    console.log(`[${fetched + 1}/${total}] Fetching image for "${entry.term}"...`);
    let imageUrl = await fetchImage(entry.term);

    // If rate limited unexpectedly, save and wait
    if (imageUrl === 'RATE_LIMITED') {
      fs.writeFileSync(DICT_PATH, JSON.stringify(dictionary, null, 2));
      console.log(`--- Unexpected rate limit. Saved progress. Pausing ${formatTime(BATCH_PAUSE_MS)}...`);
      await sleep(BATCH_PAUSE_MS);
      // Retry this term
      imageUrl = await fetchImage(entry.term);
      if (imageUrl === 'RATE_LIMITED') {
        console.log(`--- Still rate limited. Using fallback for "${entry.term}".`);
        imageUrl = null;
      }
    }

    if (imageUrl && imageUrl !== 'RATE_LIMITED') {
      entry.image = imageUrl;
      fetched++;
      console.log(`  -> OK`);
    } else {
      console.log(`  -> No result, using fallback`);
      entry.image = 'https://images.unsplash.com/photo-1614164185128-e4ec99c436d7?w=400&q=80';
    }

    requestsInBatch++;
    await sleep(DELAY_MS);
  }

  fs.writeFileSync(DICT_PATH, JSON.stringify(dictionary, null, 2));
  const skipped = dictionary.length - total;
  console.log(`\nDone. Fetched: ${fetched}, Skipped (cached): ${skipped}, Fallback: ${total - fetched}`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
