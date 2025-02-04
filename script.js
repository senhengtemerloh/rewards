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
 */
function formatPrice(price) {
  const priceStr = price ? price.toString() : "";
  const cleaned = priceStr.replace(/[^0-9.]/g, "");
  const num = parseFloat(cleaned);
  if (isNaN(num)) return 'RM0.00';
  return num < 11 ? `RM${num.toFixed(2)}` : `RM${Math.round(num)}`;
}

/**
 * Format S-Coin value.
 */
function formatScoin(scoin) {
  const num = Number(scoin);
  if (isNaN(num)) return scoin;
  return num.toLocaleString('en-US');
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
  container.innerHTML = `<div class="error-message" role="alert">${message}</div>`;
}

/**
 * Render skeleton placeholders while loading data.
 */
function renderSkeletons() {
  const skeletonWrapper = document.querySelector('.skeleton-wrapper');
  skeletonWrapper.innerHTML = '';
  for (let i = 0; i < PRODUCTS_PER_PAGE; i++) {
    const skeleton = document.createElement('div');
    skeleton.className = 'skeleton';
    skeleton.style.height = '400px';
    skeletonWrapper.appendChild(skeleton);
  }
}

/**
 * Load products from the Excel file with caching.
 */
async function loadProducts() {
  toggleLoading(true);
  renderSkeletons(); // show skeleton screens

  try {
    // Check for cached data
    const cachedData = localStorage.getItem('allProducts');
    if (cachedData) {
      allProducts = JSON.parse(cachedData);
      populateBrandFilter();
      filterAndSortProducts();
      return;
    }
    // Otherwise, load from the Excel file.
    const response = await fetch('./database.xlsx');
    if (!response.ok) throw new Error('Failed to load products');
    const data = await response.arrayBuffer();
    const workbook = XLSX.read(data, { type: 'array', cellFormula: false });
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
    // Cache the data for future visits
    localStorage.setItem('allProducts', JSON.stringify(allProducts));
    populateBrandFilter();
    filterAndSortProducts();
  } catch (error) {
    showError('Failed to load products. Please check the Excel file format.');
    console.error(error);
  } finally {
    toggleLoading(false);
  }
}

/**
 * Populate the brand filter dropdown.
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
 * Filter and sort products based on search term, selected brand, and sort criteria.
 */
function filterAndSortProducts() {
  const searchTerm = document.getElementById('search').value.toLowerCase();
  const selectedBrand = document.getElementById('filter').value;
  
  // Filter products
  filteredProducts = allProducts.filter(product => {
    const nameMatches = product.NAME && product.NAME.toLowerCase().includes(searchTerm);
    const brandMatches = product.BRAND && product.BRAND.toLowerCase().includes(searchTerm);
    const matchesSearch = nameMatches || brandMatches;
    const matchesBrand = !selectedBrand || product.BRAND === selectedBrand;
    return matchesSearch && matchesBrand;
  });

  // Sort products based on the selected sort option
  const sortOption = document.getElementById('sort').value;
  if (sortOption === 'scoin-asc') {
    filteredProducts.sort((a, b) => Number(a["S-COIN"]) - Number(b["S-COIN"]));
  } else if (sortOption === 'scoin-desc') {
    filteredProducts.sort((a, b) => Number(b["S-COIN"]) - Number(a["S-COIN"]));
  } else if (sortOption === 'name-asc') {
    filteredProducts.sort((a, b) => {
      const nameA = (a.NAME || '').toLowerCase();
      const nameB = (b.NAME || '').toLowerCase();
      return nameA.localeCompare(nameB);
    });
  } else if (sortOption === 'name-desc') {
    filteredProducts.sort((a, b) => {
      const nameA = (a.NAME || '').toLowerCase();
      const nameB = (b.NAME || '').toLowerCase();
      return nameB.localeCompare(nameA);
    });
  }
  
  currentPage = 1;
  totalPages = Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE);
  renderPage(currentPage);
}

/**
 * Render products for the specified page using a document fragment.
 */
function renderPage(page) {
  const container = document.querySelector('.container');
  container.innerHTML = '';
  
  if (filteredProducts.length === 0) {
    container.innerHTML = '<div class="error-message" role="alert">No products found matching your criteria</div>';
    return;
  }
  
  const start = (page - 1) * PRODUCTS_PER_PAGE;
  const end = start + PRODUCTS_PER_PAGE;
  const fragment = document.createDocumentFragment();
  
  filteredProducts.slice(start, end).forEach(product => {
    const productBox = document.createElement('div');
    productBox.className = 'product-box';
    
    // Safe retrieval of product properties
    const safeGet = prop => product[prop] || 'N/A';
    
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
        ${ product.Remark ? `<div style="font-size: 0.8em; color: red; margin-top: 8px;">${product.Remark}</div>` : '' }
      </div>
    `;
    fragment.appendChild(productBox);
  });
  
  container.appendChild(fragment);
  updatePagination();
  
  // After rendering, attach modal click events to images (only on desktop)
  attachModalEvents();
}

/**
 * Update pagination buttons and info.
 */
function updatePagination() {
  document.getElementById('pageInfo').textContent = `Page ${currentPage} of ${totalPages}`;
  document.getElementById('firstPage').disabled = currentPage === 1;
  document.getElementById('prevPage').disabled = currentPage === 1;
  document.getElementById('nextPage').disabled = currentPage === totalPages;
  document.getElementById('lastPage').disabled = currentPage === totalPages;
}

/**
 * Attach click event listeners to product images for modal preview (desktop only).
 */
function attachModalEvents() {
  // Only add modal functionality on desktop (width >= 769px)
  if (window.innerWidth < 769) return;
  
  const images = document.querySelectorAll('.product-image');
  images.forEach(img => {
    img.style.cursor = 'zoom-in';
    img.addEventListener('click', function () {
      const modal = document.getElementById('modal');
      const modalImg = document.getElementById('modalImg');
      modal.style.display = 'block';
      modalImg.src = this.src;
    });
  });
}

/**
 * Generate a PDF file containing all products.
 * Each PDF page is A4 size with narrow margins and shows exactly 9 products,
 * ensuring that no product is split between pages.
 */
function generatePDF() {
  // Create a temporary container for PDF generation (will be appended to body)
  const pdfContainer = document.createElement('div');
  pdfContainer.className = 'pdf-container';
  pdfContainer.innerHTML = '';

  // Use allProducts (or filteredProducts if you prefer) and split into chunks of 9
  const products = allProducts;
  const chunks = [];
  for (let i = 0; i < products.length; i += 9) {
    chunks.push(products.slice(i, i + 9));
  }

  // For each chunk, create a PDF page
  chunks.forEach(chunk => {
    const pageDiv = document.createElement('div');
    pageDiv.className = 'pdf-page';
    chunk.forEach(product => {
      const productDiv = document.createElement('div');
      productDiv.className = 'pdf-product';
      const safeGet = (prop) => product[prop] || 'N/A';
      productDiv.innerHTML = `
        <div class="pdf-brand-name">${safeGet('BRAND')}</div>
        <div>
          <img src="${product.URL || 'https://pic.onlinewebfonts.com/thumbnails/icons_370375.svg'}" alt="${safeGet('NAME')}" onerror="this.src='https://pic.onlinewebfonts.com/thumbnails/icons_370375.svg'">
        </div>
        <div class="pdf-product-name">${safeGet('NAME')}</div>
        <div class="pdf-product-code">Code: ${safeGet('SCF')}</div>
        <div class="pdf-price-comparison">
          <div>RCP: ${formatPrice(product.RCP)}</div>
          <div>Member: ${formatPrice(product.BLK)}</div>
        </div>
        <div class="pdf-promo-price">${formatScoin(product["S-COIN"])} S-Coin</div>
        ${ product.Remark ? `<div style="color: red; font-size: 0.7rem;">${product.Remark}</div>` : '' }
      `;
      pageDiv.appendChild(productDiv);
    });
    pdfContainer.appendChild(pageDiv);
  });

  // Append the container to the body so it's rendered (off-screen)
  document.body.appendChild(pdfContainer);

  // Configure html2pdf options
  const opt = {
    margin:       [5, 5, 5, 5], // 5mm margins on all sides
    filename:     'products.pdf',
    image:        { type: 'jpeg', quality: 0.98 },
    html2canvas:  { scale: 2 },
    jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };

  // Generate and save the PDF, then remove the temporary container.
  html2pdf().set(opt).from(pdfContainer).save().then(() => {
    document.body.removeChild(pdfContainer);
  });
}

/* ---------------------------
   Event Listeners
--------------------------- */
// Listen for search input
document.getElementById('search').addEventListener('input', debounce(filterAndSortProducts, 300));
// Listen for brand filter changes
document.getElementById('filter').addEventListener('change', filterAndSortProducts);
// Listen for sort option changes
document.getElementById('sort').addEventListener('change', filterAndSortProducts);
// Listen for PDF generation button click
document.getElementById('generatePDF').addEventListener('click', generatePDF);

// Pagination button event listeners
document.getElementById('firstPage').addEventListener('click', () => { currentPage = 1; renderPage(currentPage); });
document.getElementById('prevPage').addEventListener('click', () => { if (currentPage > 1) { currentPage--; renderPage(currentPage); } });
document.getElementById('nextPage').addEventListener('click', () => { if (currentPage < totalPages) { currentPage++; renderPage(currentPage); } });
document.getElementById('lastPage').addEventListener('click', () => { currentPage = totalPages; renderPage(currentPage); });

// Mobile fixed scroll buttons event listeners
document.getElementById('mobileScrollTop').addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});
document.getElementById('mobileScrollBottom').addEventListener('click', () => {
  window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
});

// Modal close functionality (desktop)
const modalClose = document.getElementById('modalClose');
modalClose.addEventListener('click', () => {
  document.getElementById('modal').style.display = 'none';
});
window.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    document.getElementById('modal').style.display = 'none';
  }
});

// Load products when the window loads
window.onload = loadProducts;
