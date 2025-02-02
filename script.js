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

// Image loading handler
function handleImageLoad(imgElement) {
  const container = imgElement.parentElement;
  const loader = document.createElement('div');
  loader.className = 'image-loading';
  container.appendChild(loader);
  
  imgElement.onload = imgElement.onerror = () => {
    container.removeChild(loader);
  };
}

// Create product element
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

// Filter products
function filterProducts() {
  const searchTerm = document.getElementById('search').value.toLowerCase();
  const selectedBrand = document.getElementById('filter').value;
  
  filteredProducts = allProducts.filter(product => {
    const nameMatches = product.NAME?.toLowerCase().includes(searchTerm);
    const brandMatches = product.BRAND?.toLowerCase().includes(searchTerm);
    const matchesSearch = nameMatches || brandMatches;
    const matchesBrand = !selectedBrand || product.BRAND === selectedBrand;
    return matchesSearch && matchesBrand;
  });

  currentPage = 1;
  totalPages = Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE);
  renderPage(currentPage);
}

// Render products
function renderPage(page) {
  const container = document.querySelector('.container');
  container.innerHTML = '';

  if (filteredProducts.length === 0) {
    container.innerHTML = '<div class="error-message">No products found</div>';
    return;
  }

  const start = (page - 1) * PRODUCTS_PER_PAGE;
  const end = start + PRODUCTS_PER_PAGE;

  filteredProducts.slice(start, end).forEach(product => {
    container.appendChild(createProductElement(product));
  });
  
  updatePagination();
}

// Load products from Excel
async function loadProducts() {
  toggleLoading(true);
  try {
    const response = await fetch('./database.xlsx');
    const data = await response.arrayBuffer();
    const workbook = XLSX.read(data, { type: 'array' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    allProducts = rawData.slice(1).map(row => ({
      SCF: row[0],
      BRAND: row[1],
      NAME: row[2],
      RCP: row[3],
      BLK: row[4],
      "S-COIN": row[6],
      Remark: row[7],
      URL: row[8]
    }));

    populateBrandFilter();
    filterProducts();
  } catch (error) {
    showError('Failed to load products. Please check the Excel file.');
  } finally {
    toggleLoading(false);
  }
}

// Populate brand filter
function populateBrandFilter() {
  const brands = [...new Set(allProducts.map(p => p.BRAND))].filter(Boolean);
  const filterSelect = document.getElementById('filter');
  filterSelect.innerHTML = '<option value="">All Brands</option>';
  brands.forEach(brand => {
    const option = document.createElement('option');
    option.value = brand;
    option.textContent = brand;
    filterSelect.appendChild(option);
  });
}

// Update pagination controls
function updatePagination() {
  const updateSection = (suffix = '') => {
    document.getElementById(`pageInfo${suffix}`).textContent = `Page ${currentPage} of ${totalPages}`;
    document.getElementById(`firstPage${suffix}`).disabled = currentPage === 1;
    document.getElementById(`prevPage${suffix}`).disabled = currentPage === 1;
    document.getElementById(`nextPage${suffix}`).disabled = currentPage === totalPages;
    document.getElementById(`lastPage${suffix}`).disabled = currentPage === totalPages;
  };
  
  updateSection();
  updateSection('Top');
}

// Navigation setup
function setupNavigation() {
  // Sync pagination controls
  document.querySelectorAll('.pagination-top button').forEach(button => {
    button.addEventListener('click', () => {
      const action = button.id.replace('Top', '');
      document.getElementById(action).click();
    });
  });

  // Scroll handlers
  document.getElementById('jumpToBottom').addEventListener('click', () => {
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  });

  document.getElementById('backToTop').addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

// Loading spinner
function toggleLoading(show) {
  document.querySelector('.loading-spinner').style.display = show ? 'block' : 'none';
}

// Error handling
function showError(message) {
  const container = document.querySelector('.container');
  container.innerHTML = `<div class="error-message">${message}</div>`;
}

// Event listeners
document.getElementById('search').addEventListener('input', debounce(filterProducts, 300));
document.getElementById('filter').addEventListener('change', filterProducts);
document.getElementById('firstPage').addEventListener('click', () => { currentPage = 1; renderPage(currentPage); });
document.getElementById('prevPage').addEventListener('click', () => { if (currentPage > 1) currentPage--; renderPage(currentPage); });
document.getElementById('nextPage').addEventListener('click', () => { if (currentPage < totalPages) currentPage++; renderPage(currentPage); });
document.getElementById('lastPage').addEventListener('click', () => { currentPage = totalPages; renderPage(currentPage); });

// Initialization
window.onload = () => {
  loadProducts();
  setupNavigation();
};
