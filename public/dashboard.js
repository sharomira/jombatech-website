document.addEventListener('DOMContentLoaded', () => {
  const homeSearchInput = document.getElementById('home-search-input');
  const homeSearchToggle = document.getElementById('home-search-toggle');
  const homeSearchIconBtn = document.getElementById('home-search-icon-btn');

  function redirectToShop() {
    const query = homeSearchInput.value.trim();
    if (query !== '') {
      // Redirect to shop.html carrying the search term in the URL query string
      window.location.href = `shop.html?search=${encodeURIComponent(query)}`;
    }
  }

  // Redirect on pressing Enter inside the homepage search bar
  if (homeSearchInput) {
    homeSearchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        redirectToShop();
      }
    });
  }

  // Redirect on clicking the Search Icon when text is present
  if (homeSearchIconBtn && homeSearchToggle) {
    homeSearchIconBtn.addEventListener('click', () => {
      if (homeSearchToggle.checked && homeSearchInput.value.trim() !== '') {
        redirectToShop();
      } else if (!homeSearchToggle.checked) {
        setTimeout(() => homeSearchInput.focus(), 100);
      }
    });
  }
});