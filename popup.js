// DOM要素
const searchInput = document.getElementById('searchInput');
const suggestions = document.getElementById('suggestions');
const categoriesList = document.getElementById('categoriesList');
const viewAllLink = document.getElementById('viewAllLink');
const resultsSection = document.getElementById('resultsSection');
const recentSection = document.getElementById('recentSection');
const recentList = document.getElementById('recentList');
const clearRecentButton = document.getElementById('clearRecentButton');
const backButton = document.getElementById('backButton');
const resultsTitle = document.getElementById('resultsTitle');
const resultsList = document.getElementById('resultsList');
const moreButton = document.getElementById('moreButton');
const viewMoreButton = document.getElementById('viewMoreButton');
const remainingCount = document.getElementById('remainingCount');
const copyNotification = document.getElementById('copyNotification');

// 状態管理
let currentCategory = null;
let currentSearchQuery = null;
const MAX_DISPLAY = 30; // 表示する最大数
const RECENT_MAX = 10; // 最近使用した顔文字の最大保存数

// 初期化
document.addEventListener('DOMContentLoaded', () => {
  loadRecentKaomojis();
  displayCategories();
  setupEventListeners();
});

// イベントリスナー設定
function setupEventListeners() {
  searchInput.addEventListener('input', handleSearch);
  searchInput.addEventListener('focus', () => {
    if (searchInput.value) {
      handleSearch();
    }
  });

  backButton.addEventListener('click', showHome);

  // Clear Recent ボタン
  clearRecentButton.addEventListener('click', clearRecentKaomojis);

  // 全部を見るリンク
  viewAllLink.addEventListener('click', (e) => {
    e.preventDefault();
    chrome.tabs.create({ url: 'https://www.kaomojiya.org/kaomoji-list' });
  });

  // クリック外しでサジェスション非表示
  document.addEventListener('click', (e) => {
    if (!searchInput.contains(e.target) && !suggestions.contains(e.target)) {
      suggestions.classList.remove('active');
    }
  });
}

// 検索処理
function handleSearch() {
  const query = searchInput.value.trim().toLowerCase();

  if (!query) {
    suggestions.classList.remove('active');
    return;
  }

  // マッチするカテゴリーを検索（すべてのカテゴリーから）
  const matches = Object.keys(KAOMOJI_DATA).filter(categoryId => {
    const category = KAOMOJI_DATA[categoryId];
    return category.keywords.some(keyword =>
      keyword.toLowerCase().includes(query)
    );
  });

  if (matches.length > 0) {
    displaySuggestions(matches);
  } else {
    suggestions.classList.remove('active');
  }
}

// サジェスション表示
function displaySuggestions(matches) {
  suggestions.innerHTML = matches
    .slice(0, 5)
    .map(categoryId => {
      const category = KAOMOJI_DATA[categoryId];
      return `
        <div class="suggestion-item" data-category="${categoryId}">
          ${category.name} (${category.kaomojis.length}個)
        </div>
      `;
    })
    .join('');

  suggestions.classList.add('active');

  // サジェスションクリックイベント
  suggestions.querySelectorAll('.suggestion-item').forEach(item => {
    item.addEventListener('click', () => {
      const categoryId = item.dataset.category;
      showCategory(categoryId);
      suggestions.classList.remove('active');
      searchInput.value = '';
    });
  });
}

// カテゴリー一覧表示
function displayCategories() {
  categoriesList.innerHTML = POPULAR_CATEGORIES
    .map(categoryId => {
      const category = KAOMOJI_DATA[categoryId];
      return `
        <div class="category-card" data-category="${categoryId}">
          <div class="category-name">${category.name}</div>
          <div class="category-count">${category.kaomojis.length}個</div>
        </div>
      `;
    })
    .join('');

  // カテゴリークリックイベント
  categoriesList.querySelectorAll('.category-card').forEach(card => {
    card.addEventListener('click', () => {
      const categoryId = card.dataset.category;
      showCategory(categoryId);
    });
  });
}

// カテゴリー詳細表示
function showCategory(categoryId) {
  currentCategory = categoryId;
  const category = KAOMOJI_DATA[categoryId];

  // ビューを切り替え
  document.querySelector('.categories-section').style.display = 'none';
  resultsSection.style.display = 'flex';

  // タイトル設定
  resultsTitle.textContent = `${category.name} (${category.kaomojis.length}個)`;

  // 顔文字表示（最初の30個）
  const displayKaomojis = category.kaomojis.slice(0, MAX_DISPLAY);
  displayKaomojiList(displayKaomojis);

  // 「もっと見る」ボタン表示判定
  if (category.kaomojis.length > MAX_DISPLAY) {
    const remaining = category.kaomojis.length - MAX_DISPLAY;
    // 100個以上の場合は "100+" と表示
    remainingCount.textContent = remaining >= 100 ? '100+' : remaining;
    moreButton.style.display = 'block';

    // クリックイベント（一度だけ設定）
    viewMoreButton.onclick = () => {
      openWebsite(category.slug);
    };
  } else {
    moreButton.style.display = 'none';
  }
}

// 顔文字リスト表示
function displayKaomojiList(kaomojis) {
  resultsList.innerHTML = kaomojis
    .map(kaomoji => `
      <div class="kaomoji-item" data-kaomoji="${escapeHtml(kaomoji)}">
        ${kaomoji}
      </div>
    `)
    .join('');

  // クリックイベント
  resultsList.querySelectorAll('.kaomoji-item').forEach(item => {
    item.addEventListener('click', () => {
      const kaomoji = item.dataset.kaomoji;
      copyToClipboard(kaomoji);
      saveToRecent(kaomoji);
    });
  });
}

// 最近使用した顔文字を読み込み
function loadRecentKaomojis() {
  chrome.storage.local.get(['recentKaomojis'], (result) => {
    const recent = result.recentKaomojis || [];
    if (recent.length > 0) {
      recentSection.style.display = 'block';
      displayRecentKaomojis(recent);
    }
  });
}

// 最近使用した顔文字を表示
function displayRecentKaomojis(recent) {
  recentList.innerHTML = recent
    .slice(0, 4)
    .map(kaomoji => `
      <div class="kaomoji-item" data-kaomoji="${escapeHtml(kaomoji)}">
        ${kaomoji}
      </div>
    `)
    .join('');

  recentList.querySelectorAll('.kaomoji-item').forEach(item => {
    item.addEventListener('click', () => {
      const kaomoji = item.dataset.kaomoji;
      copyToClipboard(kaomoji);
      saveToRecent(kaomoji);
    });
  });
}

// 最近使用に保存
function saveToRecent(kaomoji) {
  chrome.storage.local.get(['recentKaomojis'], (result) => {
    let recent = result.recentKaomojis || [];

    // 既存の同じ顔文字を削除
    recent = recent.filter(k => k !== kaomoji);

    // 先頭に追加
    recent.unshift(kaomoji);

    // 最大数を超えたら削除
    if (recent.length > RECENT_MAX) {
      recent = recent.slice(0, RECENT_MAX);
    }

    // 保存
    chrome.storage.local.set({ recentKaomojis: recent }, () => {
      loadRecentKaomojis();
    });
  });
}

// 最近使用をクリア
function clearRecentKaomojis() {
  chrome.storage.local.set({ recentKaomojis: [] }, () => {
    recentSection.style.display = 'none';
    // クリア通知を表示
    clearRecentButton.textContent = '✓ クリア済み';
    clearRecentButton.style.color = '#4caf50';
    setTimeout(() => {
      clearRecentButton.textContent = '×すべてクリア';
      clearRecentButton.style.color = '';
    }, 1500);
  });
}

// クリップボードにコピー
function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
    showCopyNotification();
  }).catch(err => {
    console.error('コピーに失敗しました:', err);
  });
}

// コピー通知表示
function showCopyNotification() {
  copyNotification.classList.add('show');
  setTimeout(() => {
    copyNotification.classList.remove('show');
  }, 1500);
}

// ホーム画面に戻る
function showHome() {
  resultsSection.style.display = 'none';
  document.querySelector('.categories-section').style.display = 'block';
  searchInput.value = '';
  suggestions.classList.remove('active');
}

// ウェブサイトを開く
function openWebsite(slug) {
  const url = `https://kaomojiya.org/${slug}-kaomoji`;
  chrome.tabs.create({ url });
}

// HTML エスケープ
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
