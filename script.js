// Number of products per page
const PRODUCTS_PER_PAGE = 9;
let currentPage = 1;
let totalPages = 0;
let allProducts = [];
let filteredProducts = [];

/**
 * Debounce function: delays processing until the user stops typing.
 */
const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(null, args), delay);
  };
};

/**
 * Format price in RM.
 * - Cleans the input value by removing any non-digit (except decimal point) characters.
 * - If price is below RM11, display two decimals (e.g. RM10.00).
 * - Otherwise, round to the nearest whole number (e.g. RM11).
 */
function formatPrice(price) {
  // Convert the price to a string and remove any non-digit (except ".") characters.
  const priceStr = price ? price.toString() : "";
  const cleaned = priceStr.replace(/[^0-9.]/g, "");
  const num = parseFloat(cleaned);
  if (isNaN(num)) return 'RM0.00';
  if (num < 11) {
    return `RM${num.toFixed(2)}`;
  } else {
    return `RM${Math.round(num)}`;
  }
}

/**
 * Format S-Coin value.
 * Converts the S-Coin value into an integer and formats it with comma separators.
 * For example, 10000 becomes "10,000".
 */
function formatScoin(scoin) {
  const num = Number(scoin); // or parseInt(scoin, 10)
  if (isNaN(num)) return scoin;
  return num.toLocaleString('en-US');
}

/**
 * Loads the products from the Excel file using the XLSX library.
 * We map the columns by index:
 *   0: SCF, 1: BRAND, 2: NAME, 3: RCP, 4: BLK, 5: RM (ignored),
 *   6: S-COIN, 7: Remark, 8: URL
 */
async function loadProducts() {
  toggleLoading(true);
  try {
    const response = await fetch('./database.xlsx');
    if (!response.ok) throw new Error('Failed to load products');
    const data = await response.arrayBuffer();
    const workbook = XLSX.read(data, { type: 'array', cellFormula: false });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];

    // Get the raw data (an array of rows) with header row included.
    const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    // Uncomment to debug:
    // console.log("Raw data:", rawData);

    // Map each row (skipping the header row) by fixed index.
    allProducts = rawData.slice(1).map(row => {
      return {
        SCF: row[0],
        BRAND: row[1],
        NAME: row[2],
        RCP: row[3],
        BLK: row[4],
        // Ignore the RM column at index 5.
        "S-COIN": row[6],
        Remark: row[7],
        URL: row[8]
      };
    });

    // Uncomment to debug:
    // console.log("All products:", allProducts);

    populateBrandFilter();
    filterProducts();
  } catch (error) {
    showError('Failed to load products. Please check the Excel file format.');
    console.error(error);
  } finally {
    toggleLoading(false);
  }
}

/**
 * Populate the brand filter dropdown with unique brand values.
 */
function populateBrandFilter() {
  const brands = [...new Set(allProducts.map(p => p.BRAND))].filter(b => b);
  const filterSelect = document.getElementById('filter');
  filterSelect.innerHTML = '<option value="">All Brands</option>';
  brands.forEach(brand => {
    const option = document.createElement('option');
    option.value = brand;
    option.textContent = brand;
    filterSelect.appendChild(option);
  });
}

/**
 * Filter products based on search term and selected brand.
 */
function filterProducts() {
  const searchTerm = document.getElementById('search').value.toLowerCase();
  const selectedBrand = document.getElementById('filter').value;
  
  filteredProducts = allProducts.filter(product => {
    const nameMatches = product.NAME && product.NAME.toLowerCase().includes(searchTerm);
    const brandMatches = product.BRAND && product.BRAND.toLowerCase().includes(searchTerm);
    const matchesSearch = nameMatches || brandMatches;
    const matchesBrand = !selectedBrand || product.BRAND === selectedBrand;
    return matchesSearch && matchesBrand;
  });

  currentPage = 1;
  totalPages = Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE);
  renderPage(currentPage);
}

/**
 * Render products for the specified page.
 */
function renderPage(page) {
  const container = document.querySelector('.container');
  container.innerHTML = '';

  if (filteredProducts.length === 0) {
    container.innerHTML = '<div class="error-message">No products found matching your criteria</div>';
    return;
  }

  const start = (page - 1) * PRODUCTS_PER_PAGE;
  const end = start + PRODUCTS_PER_PAGE;

  filteredProducts.slice(start, end).forEach(product => {
    const productBox = document.createElement('div');
    productBox.className = 'product-box';

    // Safe retrieval of product data; if a value is missing, display "N/A".
    const safeGet = (prop) => product[prop] || 'N/A';

    productBox.innerHTML = `
      <div class="brand-name">${safeGet('BRAND')}</div>
      <div class="product-image-container">
        <img class="product-image" 
             src="${product.URL || 'https://pic.onlinewebfonts.com/thumbnails/icons_370375.svg'}" 
             alt="${safeGet('NAME')}"
             loading="lazy"
             onerror="this.src='https://pic.onlinewebfonts.com/thumbnails/icons_370375.svg'">
      </div>
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
        ${
          product.Remark 
            ? `<div style="font-size: 0.8em; color: red; margin-top: 8px;">${product.Remark}</div>` 
            : ''
        }
      </div>
    `;
    container.appendChild(productBox);
  });
  updatePagination();
}

/**
 * Update the pagination buttons and info.
 */
function updatePagination() {
  document.getElementById('pageInfo').textContent = `Page ${currentPage} of ${totalPages}`;
  document.getElementById('firstPage').disabled = currentPage === 1;
  document.getElementById('prevPage').disabled = currentPage === 1;
  document.getElementById('nextPage').disabled = currentPage === totalPages;
  document.getElementById('lastPage').disabled = currentPage === totalPages;
}

/**
 * Show or hide the loading spinner.
 */
function toggleLoading(show) {
  document.querySelector('.loading-spinner').style.display = show ? 'block' : 'none';
}

/**
 * Display an error message in the container.
 */
function showError(message) {
  const container = document.querySelector('.container');
  container.innerHTML = `<div class="error-message">${message}</div>`;
}

// Event Listeners
document.getElementById('search').addEventListener('input', debounce(filterProducts, 300));
document.getElementById('filter').addEventListener('change', filterProducts);
document.getElementById('firstPage').addEventListener('click', () => { currentPage = 1; renderPage(currentPage); });
document.getElementById('prevPage').addEventListener('click', () => { if (currentPage > 1) { currentPage--; renderPage(currentPage); } });
document.getElementById('nextPage').addEventListener('click', () => { if (currentPage < totalPages) { currentPage++; renderPage(currentPage); } });
document.getElementById('lastPage').addEventListener('click', () => { currentPage = totalPages; renderPage(currentPage); });

// Initial load of products
window.onload = loadProducts;