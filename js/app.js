/**
 * CEPT CHRONICLES - APPLICATION CONTROLLER
 * Faithful vanilla JS replication of state, router, and interactions.
 */

(function () {
  'use strict';

  // --- State ---
  let currentView = 'landing';
  let currentArticle = null;

  // --- DOM Elements ---
  const views = {
    landing: document.getElementById('landing-view'),
    articles: document.getElementById('articles-view'),
    'article-detail': document.getElementById('article-detail-view'),
    events: document.getElementById('events-view'),
    team: document.getElementById('team-view'),
    about: document.getElementById('about-view'),
  };

  const landingNav = document.getElementById('landing-nav');
  const articlesGrid = document.getElementById('articles-grid');
  const eventsGrid = document.getElementById('events-grid');
  const teamRoster = document.getElementById('team-roster');
  const articleDetailBackBtn = document.getElementById('article-detail-back-btn');

  // --- Image Placeholder & Shimmer Helper ---
  function setupImagePlaceholder(wrapper, img) {
    if (!wrapper || !img) return;

    if (img.complete && img.naturalWidth > 0) {
      wrapper.classList.add('loaded');
    } else {
      wrapper.classList.remove('loaded');
      img.addEventListener('load', () => {
        wrapper.classList.add('loaded');
      }, { once: true });
      img.addEventListener('error', () => {
        wrapper.classList.add('loaded');
      }, { once: true });
    }
  }

  function initExistingPlaceholders() {
    document.querySelectorAll('.img-placeholder-wrapper').forEach((wrapper) => {
      const img = wrapper.querySelector('img');
      if (img) setupImagePlaceholder(wrapper, img);
    });
  }

  // --- Router / View Navigation ---
  function navigateTo(viewName, params = {}, pushHistory = true) {
    if (!views[viewName]) return;

    // Remove active state from current view
    Object.keys(views).forEach((key) => {
      views[key].classList.remove('active');
    });

    currentView = viewName;
    views[viewName].classList.add('active');
    window.scrollTo({ top: 0, behavior: 'instant' });

    if (viewName === 'article-detail' && params.article) {
      currentArticle = params.article;
      renderArticleDetail(params.article);
    } else {
      currentArticle = null;
    }

    if (pushHistory) {
      const hash = viewName === 'landing' ? '' : '#' + viewName + (params.article ? '/' + params.article.id : '');
      history.pushState({ view: viewName, articleId: params.article ? params.article.id : null }, '', hash || window.location.pathname);
    }
  }

  // Handle browser Back / Forward navigation
  window.addEventListener('popstate', (e) => {
    if (e.state && e.state.view) {
      let article = null;
      if (e.state.view === 'article-detail' && e.state.articleId) {
        article = window.articlesData.find((a) => a.id === e.state.articleId);
      }
      navigateTo(e.state.view, { article }, false);
    } else {
      handleInitialRoute(false);
    }
  });

  function handleInitialRoute(pushHistory = false) {
    const hash = window.location.hash.replace(/^#/, '');
    if (!hash) {
      navigateTo('landing', {}, pushHistory);
      return;
    }

    const parts = hash.split('/');
    const viewName = parts[0];
    const subId = parts[1] ? parseInt(parts[1], 10) : null;

    if (viewName === 'article-detail' && subId) {
      const article = (window.articlesData || []).find((a) => a.id === subId);
      if (article) {
        navigateTo('article-detail', { article }, pushHistory);
        return;
      }
    }

    if (views[viewName]) {
      navigateTo(viewName, {}, pushHistory);
    } else {
      navigateTo('landing', {}, pushHistory);
    }
  }

  // --- Landing Screen Navigation Interactions ---
  function initLandingScreen() {
    const landingView = views.landing;
    const bottomBar = document.getElementById('landing-bottom-bar');

    // Clicking anywhere on the landing screen (except the bottom bar) navigates to Articles
    landingView.addEventListener('click', (e) => {
      if (bottomBar.contains(e.target)) return;
      navigateTo('articles');
    });

    // Nav link hover focus / mutual dimming
    const navButtons = landingNav.querySelectorAll('.nav-link-btn');
    navButtons.forEach((btn) => {
      btn.addEventListener('mouseenter', () => {
        landingNav.classList.add('is-hovering');
        btn.classList.add('is-active-hover');
      });

      btn.addEventListener('mouseleave', () => {
        landingNav.classList.remove('is-hovering');
        btn.classList.remove('is-active-hover');
      });

      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const target = btn.getAttribute('data-target');
        navigateTo(target);
      });
    });
  }

  // --- Render Articles Grid ---
  function renderArticles() {
    if (!articlesGrid || !window.articlesData) return;

    articlesGrid.innerHTML = '';

    window.articlesData.forEach((article) => {
      const isFeatured = article.id === 1;

      const card = document.createElement('article');
      card.className = `article-card${isFeatured ? ' featured' : ''}`;
      card.dataset.id = article.id;

      card.innerHTML = `
        <div class="article-card-img-wrap img-placeholder-wrapper">
          <img
            class="article-card-img"
            src="${article.img}"
            alt="${article.headline.replace(/"/g, '&quot;')}"
            loading="lazy"
          />
        </div>
        <div class="article-card-overlay">
          <span class="article-tag">${article.tag}</span>
          <h2 class="article-headline">${article.headline}</h2>
          ${isFeatured ? `<p class="article-excerpt">${article.excerpt}</p>` : ''}
          <span class="article-meta">${article.byline} · ${article.date}</span>
        </div>
      `;

      // Setup image placeholder
      const imgWrap = card.querySelector('.article-card-img-wrap');
      const img = card.querySelector('.article-card-img');
      setupImagePlaceholder(imgWrap, img);

      // Card hover focus / blur sibling effect
      card.addEventListener('mouseenter', () => {
        articlesGrid.classList.add('has-card-hover');
        card.classList.add('is-card-hovered');
      });

      card.addEventListener('mouseleave', () => {
        articlesGrid.classList.remove('has-card-hover');
        card.classList.remove('is-card-hovered');
      });

      // Card click opens Article Detail View
      card.addEventListener('click', () => {
        navigateTo('article-detail', { article });
      });

      articlesGrid.appendChild(card);
    });
  }

  // --- Render Article Detail View ---
  function renderArticleDetail(article) {
    const heroWrap = document.getElementById('article-detail-hero-wrap');
    const heroImg = document.getElementById('detail-hero-img');
    const tagEl = document.getElementById('detail-tag');
    const headlineEl = document.getElementById('detail-headline');
    const subEl = document.getElementById('detail-sub');
    const metaEl = document.getElementById('detail-meta');
    const leadEl = document.getElementById('detail-lead');
    const paragraphsContainer = document.getElementById('detail-paragraphs');

    tagEl.textContent = article.tag;
    headlineEl.textContent = article.headline;
    subEl.textContent = article.sub;
    metaEl.textContent = `${article.byline} · ${article.date} · ${article.readTime} read`;
    leadEl.textContent = article.excerpt;

    // Load Image with shimmer
    heroWrap.classList.remove('loaded');
    heroImg.src = article.img;
    heroImg.alt = article.headline;
    setupImagePlaceholder(heroWrap, heroImg);

    // Deep editorial story paragraphs
    const paragraphs = [
      'By Tuesday evening, the water level in the ground-floor corridor of the Faculty of Architecture had reached nearly 40 centimetres. Studio pinups were cancelled. Several students reported losing mounted drawings and printed thesis panels. The amphitheatre — a space central to campus social life — remained flooded through Wednesday morning. The hostel pathways were entirely impassable after dark, with no temporary lighting or hazard marking in place.',
      'What makes the situation particularly pointed is that CEPT\'s own faculty and students regularly produce research and design work on climate-adaptive urbanism, stormwater management, and flood-resilient infrastructure. The irony was not lost on anyone wading through the campus. "We did a studio last semester on urban drainage for Ahmedabad," said one fourth-year planning student. "I\'m going to dig out my own submission and hand it to the administration."',
      'The administration has acknowledged the flooding and stated that a structural assessment of the drainage network is underway. A student union petition calling for a transparent timeline on campus infrastructure improvements has gathered over 600 signatures in 48 hours. This is the second significant flooding event on campus in three years.'
    ];

    paragraphsContainer.innerHTML = paragraphs
      .map((p) => `<p class="article-detail-p">${p}</p>`)
      .join('');
  }

  // --- Render Event Highlights Grid ---
  function renderEvents() {
    if (!eventsGrid || !window.eventsData) return;

    eventsGrid.innerHTML = '';

    window.eventsData.forEach((event) => {
      const card = document.createElement('div');
      card.className = 'event-card';
      card.dataset.id = event.id;

      card.innerHTML = `
        <div class="event-card-img-wrap img-placeholder-wrapper">
          <img
            class="event-card-img"
            src="${event.img}"
            alt="${event.title.replace(/"/g, '&quot;')}"
            loading="lazy"
          />
        </div>
        <div class="event-card-overlay">
          ${
            event.live
              ? `<div class="event-live-badge">
                  <span class="event-live-dot"></span>
                  <span class="event-live-text">Live</span>
                </div>`
              : `<div></div>`
          }
          <div class="event-content">
            <h3 class="event-title">${event.title}</h3>
            <p class="event-desc">${event.desc}</p>
            <span class="event-meta">${event.time} · ${event.date}</span>
          </div>
        </div>
      `;

      // Setup image placeholder
      const imgWrap = card.querySelector('.event-card-img-wrap');
      const img = card.querySelector('.event-card-img');
      setupImagePlaceholder(imgWrap, img);

      // Card hover focus / blur sibling effect
      card.addEventListener('mouseenter', () => {
        eventsGrid.classList.add('has-card-hover');
        card.classList.add('is-card-hovered');
      });

      card.addEventListener('mouseleave', () => {
        eventsGrid.classList.remove('has-card-hover');
        card.classList.remove('is-card-hovered');
      });

      eventsGrid.appendChild(card);
    });
  }

  // --- Render The Team Roster ---
  function renderTeam() {
    if (!teamRoster || !window.teamData) return;

    teamRoster.innerHTML = '';

    window.teamData.forEach((member, index) => {
      const item = document.createElement('span');
      item.className = 'team-member-item';

      const isLast = index === window.teamData.length - 1;
      item.innerHTML = `
        <span class="team-member-name">${member.name}</span>
        ${!isLast ? '<span class="team-dot-separator"></span>' : ''}
      `;

      teamRoster.appendChild(item);
    });
  }

  // --- General Event Listeners ---
  function initGlobalListeners() {
    // Back to Home buttons
    document.querySelectorAll('[data-nav="landing"]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        navigateTo('landing');
      });
    });

    // Back to Articles button on Article Detail screen
    if (articleDetailBackBtn) {
      articleDetailBackBtn.addEventListener('click', (e) => {
        e.preventDefault();
        navigateTo('articles');
      });
    }

    // Keyboard navigation (ESC returns to Home or Articles)
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (currentView === 'article-detail') {
          navigateTo('articles');
        } else if (currentView !== 'landing') {
          navigateTo('landing');
        }
      }
    });
  }

  // --- App Initialization ---
  function init() {
    initExistingPlaceholders();
    initLandingScreen();
    renderArticles();
    renderEvents();
    renderTeam();
    initGlobalListeners();
    handleInitialRoute(false);
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
