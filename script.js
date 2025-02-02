const PRODUCTS_PER_PAGE = 9;
let currentPage = 1;
let totalPages = 0;
let allProducts = [];
let filteredProducts = [];

// Debounce function
const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(null, args), delay);
  };
};

// Price formatting
function formatPrice(price) {
  const priceStr = price ? price.toString() : "";
  const cleaned = priceStr.replace(/[^0-9.]/g, "");
  const num = parseFloat(cleaned);
  if (isNaN(num)) return 'RM0.00';
  return num < 11 ? `RM${num.toFixed(2)}` : `RM${Math.round(num)}`;
}

// S-Coin formatting
function formatScoin(scoin) {
  const num = Number(scoin);
  return isNaN(num) ? scoin : num.toLocaleString('en-US');
}

// Image loader handler
function handleImageLoad(imgElement) {
  const container = imgElement.parentElement;
  const loader = document.createElement('div');
  loader.className = 'image-loading';
  container.appendChild(loader);
  
  imgElement.onload = imgElement.onerror = () => {
    container.removeChild(loader);
  };
}

// Product rendering
function createProductElement(product) {
  const productBox = document.createElement('div');
  productBox.className = 'product-box';

  const safeGet = (prop) => product[prop] || 'N/A';
  
  const img = new Image();
  img.classList.add('product-image');
  img.src = product.URL || 'https://pic.onlinewebfonts.com/thumbnails/icons_370375.svg';
  img.alt = safeGet('NAME');
  img.loading = 'lazy';
  handleImageLoad(img);

  productBox.innerHTML = `
    <div class="brand-name">${safeGet('BRAND')}</div>
    <div class="product-image-container"></div>
    <div class="product-details">
      <div class="product-name">${safeGet('NAME')}</div>
      <div class="product-code">Code: ${safeGet('SCF')}</div>
      <div class="price-comparison">
        <div class="price-item rcp-price">
          <div class="price-label">RCP</div>
          <div class="price-value">${formatPrice(product.RCP)}</div>
        </div>
        <div class="price-item member-price">
          <div class="price-label">Member Price</div>
          <div class="price-value">${formatPrice(product.BLK)}</div>
        </div>
      </div>
      <div class="promo-price">
        <span class="coin-points">${formatScoin(product["S-COIN"])}</span>
        S-Coin Points
      </div>
      ${product.Remark ? `<div class="product-remark">${product.Remark}</div>` : ''}
    </div>
  `;

  productBox.querySelector('.product-image-container').appendChild(img);
  return productBox;
}

// Pagination update
function updatePagination() {
  const updatePaginationSection = (suffix = '') => {
    document.getElementById(`pageInfo${suffix}`).textContent = `Page ${currentPage} of ${totalPages}`;
    document.getElementById(`firstPage${suffix}`).disabled = currentPage === 1;
    document.getElementById(`prevPage${suffix}`).disabled = currentPage === 1;
    document.getElementById(`nextPage${suffix}`).disabled = currentPage === totalPages;
    document.getElementById(`lastPage${suffix}`).disabled = currentPage === totalPages;
  };
  
  updatePaginationSection();
  updatePaginationSection('Top');
}

// Navigation handlers
function setupNavigation() {
  // Pagination sync
  document.querySelectorAll('.pagination-top button').forEach(button => {
    button.addEventListener('click', () => {
      const action = button.id.replace('Top', '');
      document.getElementById(action).click();
    });
  });

  // Scroll buttons
  document.getElementById('jumpToBottom').addEventListener('click', () => {
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  });

  document.getElementById('backToTop').addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

// Rest of your existing code (loadProducts, populateBrandFilter, filterProducts, 
// renderPage, toggleLoading, showError) remains unchanged...

// Update event listeners at bottom:
document.getElementById('search').addEventListener('input', debounce(filterProducts, 300));
document.getElementById('filter').addEventListener('change', filterProducts);
document.getElementById('firstPage').addEventListener('click', () => { currentPage = 1; renderPage(currentPage); });
document.getElementById('prevPage').addEventListener('click', () => { if (currentPage > 1) { currentPage--; renderPage(currentPage); } });
document.getElementById('nextPage').addEventListener('click', () => { if (currentPage < totalPages) { currentPage++; renderPage(currentPage); } });
document.getElementById('lastPage').addEventListener('click', () => { currentPage = totalPages; renderPage(currentPage); });

// Initialize navigation
window.onload = () => {
  loadProducts();
  setupNavigation();
};
