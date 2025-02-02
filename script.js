const PRODUCTS_PER_PAGE = 9;
let currentPage = 1;
let totalPages = 0;
let allProducts = [];
let filteredProducts = [];

// Debounce function remains same
const debounce = (func, delay) => { /* ... */ };

// Price formatting remains same
function formatPrice(price) { /* ... */ }

// S-Coin formatting remains same
function formatScoin(scoin) { /* ... */ }

// New image loader handler
function handleImageLoad(imgElement) { /* ... */ }

// Updated product element creation
function createProductElement(product) { /* ... */ }

// Critical Fix: Restore original filter logic
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

// Critical Fix: Restore original renderPage structure
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

// Restore original loadProducts function
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

// Restore original brand filter population
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

// Keep the pagination update function
function updatePagination() { /* ... */ }

// Keep the navigation setup
function setupNavigation() { /* ... */ }

// Keep original utility functions
function toggleLoading(show) { /* ... */ }
function showError(message) { /* ... */ }

// Event listeners remain same
document.getElementById('search').addEventListener('input', debounce(filterProducts, 300));
document.getElementById('filter').addEventListener('change', filterProducts);
document.getElementById('firstPage').addEventListener('click', () => { currentPage = 1; renderPage(currentPage); });
document.getElementById('prevPage').addEventListener('click', () => { if (currentPage > 1) currentPage--; renderPage(currentPage); });
document.getElementById('nextPage').addEventListener('click', () => { if (currentPage < totalPages) currentPage++; renderPage(currentPage); });
document.getElementById('lastPage').addEventListener('click', () => { currentPage = totalPages; renderPage(currentPage); });

// Initialize
window.onload = () => {
  loadProducts();
  setupNavigation();
};
