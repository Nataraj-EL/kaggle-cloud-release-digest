document.addEventListener('DOMContentLoaded', () => {
    const refreshBtn = document.getElementById('refresh-btn');
    const loadingSpinner = document.getElementById('loading-spinner');
    const shareBtn = document.getElementById('share-btn');
    const releasesFeed = document.getElementById('releases-feed');
    
    let releases = [];
    let selectedIndex = null;

    // Helper to format ISO date strings from updated tag
    function formatDate(isoString) {
        if (!isoString) return '';
        try {
            const date = new Date(isoString);
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch (e) {
            return isoString;
        }
    }

    // Fetch releases from the Flask backend
    async function fetchReleases() {
        // Show spinner, disable refresh button
        loadingSpinner.classList.remove('hidden');
        refreshBtn.disabled = true;
        
        // Reset single-item selection state
        selectedIndex = null;
        shareBtn.disabled = true;
        
        releasesFeed.innerHTML = '';
        
        try {
            const response = await fetch('/api/releases');
            if (!response.ok) throw new Error('Network response was not ok');
            
            releases = await response.json();
            renderFeed();
        } catch (error) {
            console.error('Error fetching release notes:', error);
            releasesFeed.innerHTML = `
                <div class="feed-message">
                    Failed to load release notes. Please click Refresh to try again.
                </div>
            `;
        } finally {
            loadingSpinner.classList.add('hidden');
            refreshBtn.disabled = false;
        }
    }

    // Render parsed release notes into DOM
    function renderFeed() {
        if (releases.length === 0) {
            releasesFeed.innerHTML = `
                <div class="feed-message">
                    No release notes found.
                </div>
            `;
            return;
        }

        const fragment = document.createDocumentFragment();

        releases.forEach((release, index) => {
            const card = document.createElement('div');
            card.className = 'release-card';
            card.dataset.index = index;

            // Card Header: Title + custom checkbox icon
            const header = document.createElement('div');
            header.className = 'card-header';
            
            const title = document.createElement('h2');
            title.className = 'card-title';
            title.textContent = `Update: ${release.title}`;
            
            const checkbox = document.createElement('div');
            checkbox.className = 'card-checkbox';
            
            header.appendChild(title);
            header.appendChild(checkbox);

            // Card Date
            const date = document.createElement('span');
            date.className = 'card-date';
            date.textContent = formatDate(release.published);

            // Card Content (renders HTML feed content directly)
            const content = document.createElement('div');
            content.className = 'card-content';
            content.innerHTML = release.content;

            // Card Footer: Link back to Google Cloud Docs
            const footer = document.createElement('div');
            footer.className = 'card-footer';

            const sourceLink = document.createElement('a');
            sourceLink.className = 'source-link';
            sourceLink.href = release.link;
            sourceLink.target = '_blank';
            sourceLink.rel = 'noopener noreferrer';
            sourceLink.innerHTML = `
                <span>View Source</span>
                <svg class="icon icon-external" viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                    <polyline points="15 3 21 3 21 9"></polyline>
                    <line x1="10" y1="14" x2="21" y2="3"></line>
                </svg>
            `;
            
            // Prevent card selection when clicking direct source links
            sourceLink.addEventListener('click', (e) => {
                e.stopPropagation();
            });

            footer.appendChild(sourceLink);

            card.appendChild(header);
            card.appendChild(date);
            card.appendChild(content);
            card.appendChild(footer);

            // Single click-to-select handler
            card.addEventListener('click', () => {
                handleSelection(index);
            });

            fragment.appendChild(card);
        });

        releasesFeed.appendChild(fragment);
    }

    // Manage single selection logic
    function handleSelection(index) {
        const cards = document.querySelectorAll('.release-card');
        
        if (selectedIndex === index) {
            // Clicking selected card deselects it
            selectedIndex = null;
            cards[index].classList.remove('selected');
            shareBtn.disabled = true;
        } else {
            // Deselect current selection if there is one
            if (selectedIndex !== null && cards[selectedIndex]) {
                cards[selectedIndex].classList.remove('selected');
            }
            // Select new card
            selectedIndex = index;
            cards[index].classList.add('selected');
            shareBtn.disabled = false;
        }
    }

    // Share selected note on X/Twitter
    shareBtn.addEventListener('click', () => {
        if (selectedIndex === null) return;
        
        const release = releases[selectedIndex];
        
        // Pre-fill tweet parameters
        const tweetText = `BigQuery Update: ${release.title}`;
        const hashtags = 'BigQuery,GoogleCloud';
        const url = release.link;

        const xShareUrl = `https://x.com/intent/tweet?text=${encodeURIComponent(tweetText)}&url=${encodeURIComponent(url)}&hashtags=${encodeURIComponent(hashtags)}`;
        
        window.open(xShareUrl, '_blank', 'noopener,noreferrer');
    });

    // Refresh button event listener
    refreshBtn.addEventListener('click', fetchReleases);

    // Initial load
    fetchReleases();
});
