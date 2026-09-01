document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('search-input');
  const searchToggle = document.getElementById('search-toggle');
  const searchIconBtn = document.getElementById('search-icon-btn');
  const productGrid = document.getElementById('product-grid');
  const filterButtons = document.querySelectorAll('.category-filters .filter-btn');

  if (!productGrid) return;

  let allProducts = [];
  let currentCategory = 'all';

  // Phone number format: Country code (254) + your number without the leading zero (722768168)
  const WHATSAPP_NUMBER = '254722768168';

  // Helper function: Render dynamic product HTML cards with WhatsApp direct order button
  function renderProducts(productsToDisplay) {
    productGrid.innerHTML = '';

    if (productsToDisplay.length === 0) {
      productGrid.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: #64748b;">
          <h3>No products found</h3>
          <p>Try searching for something else or change category filter.</p>
        </div>
      `;
      return;
    }

    productsToDisplay.forEach(product => {
      const card = document.createElement('div');
      card.className = 'product-card';

      // Build the pre-filled message text
      const messageText = `Hello Jomba! I would like to order: ${product.title} (${product.price})`;
      const whatsappLink = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(messageText)}`;

      card.innerHTML = `
        <img src="${product.image}" alt="${product.title}" class="product-img">
        <div class="product-info">
          <h3 class="product-title">${product.title}</h3>
          <p class="product-price">${product.price}</p>
          <a href="${whatsappLink}" target="_blank" rel="noopener noreferrer" class="whatsapp-order-btn">
            💬 Order on WhatsApp
          </a>
        </div>
      `;
      productGrid.appendChild(card);
    });
  }

  // Filter products by category and search query
  function applyFilters() {
    const query = (searchInput ? searchInput.value : '').toLowerCase().trim();

    const filteredProducts = allProducts.filter(product => {
      // 1. Category check
      const matchesCategory = (currentCategory === 'all') || 
                              (product.category.toLowerCase() === currentCategory);

      // 2. Search check (title, brand, category)
      const searchableContent = `${product.title} ${product.brand || ''} ${product.category}`.toLowerCase();
      const matchesSearch = query === '' || searchableContent.includes(query);

      return matchesCategory && matchesSearch;
    });

    renderProducts(filteredProducts);
  }

  // Fetch products from Neon PostgreSQL backend API
  fetch('/api/products')
    .then(response => {
      if (!response.ok) {
        throw new Error('Database response failed');
      }
      return response.json();
    })
    .then(data => {
      allProducts = data;

      // Read URL query parameters (e.g., shop.html?search=laptops)
      const urlParams = new URLSearchParams(window.location.search);
      const searchQuery = urlParams.get('search');

      if (searchQuery) {
        if (searchInput) searchInput.value = searchQuery;
        if (searchToggle) searchToggle.checked = true;
      }

      applyFilters();
    })
    .catch(error => {
      console.error('Error fetching products from API:', error);
      productGrid.innerHTML = `
        <p style="grid-column: 1/-1; text-align: center; color: #ff4d4d; padding: 20px;">
          Failed to load products from database. Please try refreshing.
        </p>
      `;
    });

  // 2. Search Event Listeners
  if (searchInput) {
    searchInput.addEventListener('input', applyFilters);
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        applyFilters();
      }
    });
  }

  if (searchIconBtn && searchToggle) {
    searchIconBtn.addEventListener('click', () => {
      if (searchToggle.checked && searchInput && searchInput.value.trim() !== '') {
        applyFilters();
      } else if (!searchToggle.checked && searchInput) {
        setTimeout(() => searchInput.focus(), 100);
      }
    });
  }

  // 3. Category Filter Buttons Listeners
  filterButtons.forEach(button => {
    button.addEventListener('click', (e) => {
      filterButtons.forEach(btn => btn.classList.remove('active'));
      e.target.classList.add('active');
      currentCategory = e.target.getAttribute('data-category').toLowerCase();
      applyFilters();
    });
  });
});