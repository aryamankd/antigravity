const Parser = require('rss-parser');
const fs = require('fs');
const path = require('path');

const parser = new Parser({
  customFields: {
    item: [
      ['media:content', 'mediaContent', { keepArray: false }],
      ['media:thumbnail', 'mediaThumbnail', { keepArray: false }],
      ['enclosure', 'enclosure', { keepArray: false }],
    ],
  },
  timeout: 15000,
});

const FEEDS = [
  { url: 'https://www.hodinkee.com/articles/rss.xml', source: 'Hodinkee' },
  { url: 'https://www.fratellowatches.com/feed/', source: 'Fratello' },
  { url: 'https://monochrome-watches.com/feed/', source: 'Monochrome' },
  { url: 'https://watchesbysjx.com/feed', source: 'SJX' },
  { url: 'https://revolution.watch/feed/', source: 'Revolution' },
  { url: 'https://wornandwound.com/feed/', source: 'Worn & Wound' },
  { url: 'https://timeandtidewatches.com/feed/', source: 'Time+Tide' },
  { url: 'https://www.ablogtowatch.com/feed/', source: 'aBlogtoWatch' },
];

// Brand detection: scan title and categories for known brand names
const BRAND_PATTERNS = [
  { brand: 'rolex', patterns: [/\brolex\b/i] },
  { brand: 'omega', patterns: [/\bomega\b/i] },
  { brand: 'patek', patterns: [/\bpatek\b/i, /\bpatek\s*philippe\b/i] },
  { brand: 'ap', patterns: [/\baudemars\s*piguet\b/i, /\broyal\s*oak\b/i, /\b(?:AP)\b/] },
  { brand: 'jlc', patterns: [/\bjaeger[\s-]*lecoultre\b/i, /\bjlc\b/i, /\breverso\b/i] },
  { brand: 'cartier', patterns: [/\bcartier\b/i] },
  { brand: 'tudor', patterns: [/\btudor\b/i] },
  { brand: 'iwc', patterns: [/\biwc\b/i] },
];

function detectBrand(title, categories) {
  const text = `${title} ${(categories || []).join(' ')}`;
  for (const { brand, patterns } of BRAND_PATTERNS) {
    if (patterns.some(p => p.test(text))) return brand;
  }
  return 'other';
}

// Extract image URL from RSS item
function extractImage(item) {
  // media:content
  if (item.mediaContent && item.mediaContent.$ && item.mediaContent.$.url) {
    return item.mediaContent.$.url;
  }
  // media:thumbnail
  if (item.mediaThumbnail && item.mediaThumbnail.$ && item.mediaThumbnail.$.url) {
    return item.mediaThumbnail.$.url;
  }
  // enclosure
  if (item.enclosure && item.enclosure.url && /image/i.test(item.enclosure.type || '')) {
    return item.enclosure.url;
  }
  // First <img> in content/description
  const html = item['content:encoded'] || item.content || item.description || '';
  const imgMatch = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  if (imgMatch) return imgMatch[1];
  return null;
}

// Extract a category/tag from RSS item
function extractCategory(item) {
  if (item.categories && item.categories.length > 0) {
    return item.categories[0];
  }
  return 'Watch News';
}

// Format date consistently
function formatDate(dateStr) {
  const d = new Date(dateStr);
  if (isNaN(d)) return null;
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

async function fetchAllFeeds() {
  const allArticles = [];

  for (const { url, source } of FEEDS) {
    try {
      console.log(`Fetching ${source}...`);
      const feed = await parser.parseURL(url);
      for (const item of feed.items || []) {
        const image = extractImage(item);
        const date = formatDate(item.pubDate || item.isoDate);
        if (!date) continue;

        allArticles.push({
          title: item.title || '',
          link: item.link || '',
          source,
          date,
          rawDate: new Date(item.pubDate || item.isoDate).getTime(),
          image: image || null,
          category: extractCategory(item),
          brand: detectBrand(item.title || '', item.categories),
        });
      }
      console.log(`  -> ${feed.items?.length || 0} articles from ${source}`);
    } catch (err) {
      console.error(`  !! Failed to fetch ${source}: ${err.message}`);
    }
  }

  // Deduplicate by link URL
  const seen = new Set();
  const unique = allArticles.filter(a => {
    if (seen.has(a.link)) return false;
    seen.add(a.link);
    return true;
  });

  // Sort by date (newest first) and take top 40
  unique.sort((a, b) => b.rawDate - a.rawDate);
  const top = unique.slice(0, 40);

  // Clean up rawDate
  const output = top.map(({ rawDate, ...rest }) => rest);

  // Write output
  const outPath = path.join(__dirname, '..', 'data', 'news.json');
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2));
  console.log(`\nWrote ${output.length} articles to data/news.json`);
}

fetchAllFeeds().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
