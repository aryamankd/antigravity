const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const TEMPLATE = path.join(ROOT, 'template.html');
const NEWS_DATA = path.join(ROOT, 'data', 'news.json');
const DICT_DATA = path.join(ROOT, 'data', 'dictionary.json');
const OUTPUT = path.join(ROOT, 'index.html');

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1614164185128-e4ec99c436d7?w=400&q=80';

// Escape HTML entities
function esc(str) {
  return (str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// Build featured article HTML
function buildFeatured(article) {
  const img = article.image || FALLBACK_IMAGE;
  return `<a href="${esc(article.link)}" target="_blank" rel="noopener" class="news-item block relative rounded-2xl overflow-hidden group" data-brand="${esc(article.brand)}" data-show="all" data-featured="true">
        <img src="${esc(img)}" alt="" class="w-full h-[340px] object-cover group-hover:scale-105 transition-transform duration-500">
        <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>
        <div class="absolute bottom-0 left-0 right-0 p-6">
          <span class="rounded-full px-3 py-1 text-[10px] bg-gold text-emeraldDark font-medium mb-3 inline-block">${esc(article.category)}</span>
          <h3 class="font-heading text-2xl font-medium text-white leading-snug mb-2">${esc(article.title)}</h3>
          <p class="text-xs text-white/60 font-light">${esc(article.source)} &middot; ${esc(article.date)}</p>
        </div>
      </a>`;
}

// Build a single news card HTML
function buildNewsCard(article) {
  const img = article.image || FALLBACK_IMAGE;
  return `<a href="${esc(article.link)}" target="_blank" rel="noopener" class="news-item block bg-cardBg rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow border border-white/[0.08] group" data-brand="${esc(article.brand)}">
        <img src="${esc(img)}" alt="" class="w-full h-[180px] object-cover group-hover:scale-105 transition-transform duration-500">
        <div class="p-4">
          <span class="rounded-full px-2.5 py-0.5 text-[10px] bg-gold/20 text-gold font-medium">${esc(article.category)}</span>
          <p class="text-sm font-heading font-medium text-textPrimary mt-2 leading-snug">${esc(article.title)}</p>
          <p class="text-[11px] text-textSecondary font-light mt-1.5">${esc(article.source)} &middot; ${esc(article.date)}</p>
        </div>
      </a>`;
}

// Build letter nav buttons A-Z
function buildLetterNav(activeLetters) {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  return letters.map(letter => {
    const hasTerms = activeLetters.has(letter);
    if (hasTerms) {
      // First active letter gets active styling
      const isFirst = letter === [...activeLetters].sort()[0];
      if (isFirst) {
        return `<button class="letter-btn active w-8 h-8 rounded-full text-xs font-heading font-medium transition-all bg-gold text-emeraldDark shadow-sm" data-letter="${letter}">${letter}</button>`;
      }
      return `<button class="letter-btn w-8 h-8 rounded-full text-xs font-heading font-medium transition-all border border-gold/30 text-gold/40 bg-gold/5 hover:border-gold/50" data-letter="${letter}">${letter}</button>`;
    }
    return `<button class="letter-btn w-8 h-8 rounded-full text-xs font-heading font-medium transition-all border border-white/[0.06] text-textSecondary/30 cursor-default" disabled>${letter}</button>`;
  }).join('\n        ');
}

// Build dictionary terms grouped by letter
function buildDictionaryTerms(dictionary) {
  // Group by letter
  const groups = {};
  for (const entry of dictionary) {
    if (!groups[entry.letter]) groups[entry.letter] = [];
    groups[entry.letter].push(entry);
  }

  const sortedLetters = Object.keys(groups).sort();
  return sortedLetters.map((letter, i) => {
    const terms = groups[letter];
    const mtClass = i === 0 ? 'mt-2' : 'mt-8';
    const heading = `<h3 id="dict-${letter}" class="dict-group-heading font-heading text-4xl font-semibold text-gold/60 mb-4 ${mtClass}" data-letter="${letter}">${letter}</h3>`;
    const cards = terms.map(t => {
      const img = t.image || FALLBACK_IMAGE;
      return `          <div class="dict-term bg-cardBg rounded-xl overflow-hidden cursor-pointer hover:bg-boneLight transition-colors shadow-md border border-white/[0.08]">
            <img src="${esc(img)}" alt="" class="w-full h-[120px] object-cover">
            <div class="px-4 py-3">
              <div class="flex items-center justify-between">
                <h4 class="font-heading font-medium text-sm text-textPrimary">${esc(t.term)}</h4>
                <span class="toggle-icon text-gold/60 text-sm font-light ml-4">+</span>
              </div>
              <div class="def-wrap overflow-hidden max-h-0 transition-all duration-200">
                <p class="text-[11px] text-textSecondary font-light mt-2 leading-relaxed">${esc(t.definition)}</p>
              </div>
            </div>
          </div>`;
    }).join('\n');

    const grid = `        <div class="dict-group grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3" data-letter="${letter}">
${cards}
        </div>`;

    return `${heading}\n${grid}`;
  }).join('\n\n        ');
}

// Main build
function build() {
  let template = fs.readFileSync(TEMPLATE, 'utf-8');

  // Load news
  let news = [];
  if (fs.existsSync(NEWS_DATA)) {
    news = JSON.parse(fs.readFileSync(NEWS_DATA, 'utf-8'));
  }

  // Load dictionary
  let dictionary = [];
  if (fs.existsSync(DICT_DATA)) {
    dictionary = JSON.parse(fs.readFileSync(DICT_DATA, 'utf-8'));
  }

  // Featured = first article with an image
  const featured = news.find(a => a.image) || news[0];
  const gridArticles = news.filter(a => a !== featured);

  // Build HTML fragments
  const featuredHTML = featured ? buildFeatured(featured) : '';
  const newsCardsHTML = gridArticles.map(buildNewsCard).join('\n      ');

  const activeLetters = new Set(dictionary.map(t => t.letter));
  const letterNavHTML = buildLetterNav(activeLetters);
  const dictTermsHTML = buildDictionaryTerms(dictionary);

  // Replace placeholders
  template = template.replace('{{FEATURED_ARTICLE}}', featuredHTML);
  template = template.replace('{{NEWS_CARDS}}', newsCardsHTML);
  template = template.replace('{{LETTER_NAV}}', letterNavHTML);
  template = template.replace('{{DICTIONARY_TERMS}}', dictTermsHTML);

  fs.writeFileSync(OUTPUT, template);
  console.log(`Built index.html with ${news.length} articles and ${dictionary.length} dictionary terms`);
}

build();
