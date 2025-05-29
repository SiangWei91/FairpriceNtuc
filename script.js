// script.js

// --- Service Worker Registration ---
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('sw.js')
      .then((registration) => {
        console.log(
          'Service Worker: Registered successfully. Scope is:',
          registration.scope
        );
      })
      .catch((error) => {
        console.error('Service Worker: Registration failed:', error);
      });
  });
}

// Listen for messages from the Service Worker to clear Local Storage
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'CLEAR_LOCAL_STORAGE') {
      localStorage.clear();
      console.log(
        'Local storage cleared by service worker instruction due to update.'
      );
      // Alert the user that data has been reset and a refresh might be good.
      alert(
        'Application data has been reset due to an update. You might need to refresh the page.'
      );
      // Optionally, force a reload to ensure a clean state:
      // window.location.reload();
    }
  });
}

console.log('script.js loaded');

// --- Local Storage Keys ---
const PRODUCTS_KEY = 'products';
const INVENTORY_KEY = 'inventory';
const TRANSACTIONS_KEY = 'transactionLogs';

// --- Initial Product Data ---
const initialProducts = [
  {
    id: '90002',
    name: 'FOODFARE 苏东丸 - CUTTLEFISH BALL (10kg/ctn)',
    packaging: '1kg x 10pkt',
  },
  {
    id: '90003',
    name: 'FOODFARE 鱼丸 - FISH BALL (10kg/ctn)',
    packaging: '1kg x 10pkt',
  },
  {
    id: '90004',
    name: 'FOODFARE 圆饼 - ROUND FISH CAKE (10kg/ctn)',
    packaging: '1kg x 10pkt',
  },
  {
    id: '90005',
    name: 'FOODFARE 切片 - SLICED FISH CAKE (10kg/ctn)',
    packaging: '1kg x 10pkt',
  },
  {
    id: '90006',
    name: 'FOODFARE 泰式鱼饼 - THAI FISH CAKE (10kg/ctn)',
    packaging: '1kg x 10pkt',
  },
  {
    id: '90007',
    name: 'FOODFARE 虾丸 - PRAWN BALL (10kg/ctn)',
    packaging: '1kg x 10pkt',
  },
  {
    id: '90008',
    name: 'FOODFARE 海鲜条 - SEAFOOD STICK (10kg/ctn)',
    packaging: '1kg x 10pkt',
  },
  {
    id: '90009',
    name: 'FOODFARE 蟹肉饼 - CRAB MEAT CAKE (10kg/ctn)',
    packaging: '1kg x 10pkt',
  },
  {
    id: '90010',
    name: 'FOODFARE 香菇丸 - MUSHROOM BALL (10kg/ctn)',
    packaging: '1kg x 10pkt',
  },
  {
    id: '90021',
    name: 'FOODFARE 龙虾丸 - LOBSTER BALL (10kg/ctn)',
    packaging: '1kg x 10pkt',
  },
  {
    id: '90023',
    name: 'FOODFARE 五香 - NGOH HIANG (10kg/ctn)',
    packaging: '1kg x 10pkt',
  },
  {
    id: '90024',
    name: 'FOODFARE 香脆鱼块 - CHUNKY FISH NUGGET (10kg/ctn)',
    packaging: '1kg x 10pkt',
  },
  {
    id: '90025',
    name: 'FOODFARE 香脆鱼片 - BREADED FISH CHIP [FISH PATTY] (10kg/ctn',
    packaging: '1kg x 10pkt',
  },
];

// --- Local Storage Data Access Functions ---
function getProducts() {
  let products = localStorage.getItem(PRODUCTS_KEY);
  if (!products) {
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(initialProducts));
    return initialProducts;
  }
  return JSON.parse(products);
}

function getProductById(productId) {
  const products = getProducts(); // Uses LS-based getProducts
  return products.find((product) => product.id === productId) || null;
}

function getInventory() {
  const inventory = localStorage.getItem(INVENTORY_KEY);
  return inventory ? JSON.parse(inventory) : [];
}

function saveInventory(inventoryArray) {
  localStorage.setItem(INVENTORY_KEY, JSON.stringify(inventoryArray));
}

function getTransactionLogs() {
  const logs = localStorage.getItem(TRANSACTIONS_KEY);
  return logs ? JSON.parse(logs) : [];
}

function saveTransactionLogs(logsArray) {
  localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(logsArray));
}

function logTransaction(
  productId,
  productName,
  type,
  quantity,
  transactionDate,
  expirationDate
) {
  const logs = getTransactionLogs(); // Uses LS-based getTransactionLogs
  const newLog = {
    id: Date.now().toString() + '-' + Math.random().toString(36).substr(2, 9), // Simple unique ID
    productId,
    productName,
    type,
    quantity,
    date: transactionDate,
    expirationDate: expirationDate || null,
  };
  logs.push(newLog);
  saveTransactionLogs(logs); // Uses LS-based saveTransactionLogs
}

function addStock(productId, quantity, expirationDate, transactionDate) {
  const inventory = getInventory(); // LS-based
  const product = getProductById(productId); // LS-based
  if (!product) {
    console.error(`Product with ID ${productId} not found.`);
    showUIMessage(
      `Product with ID ${productId} not found. Cannot add stock.`,
      'error'
    );
    return;
  }

  quantity = parseInt(quantity, 10);
  if (isNaN(quantity) || quantity <= 0) {
    // Validation kept for robustness
    showUIMessage('Invalid quantity for addStock.', 'error');
    return;
  }

  let itemUpdated = false;
  for (let i = 0; i < inventory.length; i++) {
    if (
      inventory[i].productId === productId &&
      inventory[i].expirationDate === expirationDate
    ) {
      inventory[i].quantity += quantity;
      itemUpdated = true;
      break;
    }
  }

  if (!itemUpdated) {
    inventory.push({
      productId,
      quantity,
      expirationDate,
      // No 'id' field for LS inventory items, not needed for this simple structure
    });
  }

  saveInventory(inventory); // LS-based
  logTransaction(
    productId,
    product.name,
    'in',
    quantity,
    transactionDate,
    expirationDate
  ); // LS-based
  console.log(
    `Stock added: ${quantity} of ${product.name} (Exp: ${expirationDate}) on ${transactionDate}`
  );
}

function removeStock(productId, quantity, expirationDate, transactionDate) {
  const inventory = getInventory(); // LS-based
  const product = getProductById(productId); // LS-based
  if (!product) {
    console.error(`Product with ID ${productId} not found.`);
    showUIMessage(
      `Product with ID ${productId} not found. Cannot remove stock.`,
      'error'
    );
    return false;
  }

  quantity = parseInt(quantity, 10);
  if (isNaN(quantity) || quantity <= 0) {
    // Validation kept for robustness
    showUIMessage('Invalid quantity for removeStock.', 'error');
    return false;
  }

  let itemIndex = -1;
  for (let i = 0; i < inventory.length; i++) {
    if (
      inventory[i].productId === productId &&
      inventory[i].expirationDate === expirationDate
    ) {
      itemIndex = i;
      break;
    }
  }

  if (itemIndex !== -1) {
    if (inventory[itemIndex].quantity >= quantity) {
      inventory[itemIndex].quantity -= quantity;
      // If quantity becomes 0, the item remains in LS (original behavior)
      saveInventory(inventory); // LS-based
      logTransaction(
        productId,
        product.name,
        'out',
        quantity,
        transactionDate,
        expirationDate
      ); // LS-based
      console.log(
        `Stock removed: ${quantity} of ${product.name} (Exp: ${expirationDate}) on ${transactionDate}`
      );
      return true;
    } else {
      showUIMessage(
        `Not enough stock for ${product.name} (Exp: ${expirationDate}). Available: ${inventory[itemIndex].quantity}, Tried to remove: ${quantity}`,
        'error'
      );
      return false;
    }
  } else {
    showUIMessage(
      `Stock item not found for ${product.name} (Exp: ${expirationDate}).`,
      'error'
    );
    return false;
  }
}

// --- Date Formatting Helper ---
function formatDateToDDMMYYYY(dateStringYYYYMMDD) {
  if (!dateStringYYYYMMDD || typeof dateStringYYYYMMDD !== 'string')
    return dateStringYYYYMMDD;
  const parts = dateStringYYYYMMDD.split('-');
  if (parts.length === 3) {
    const [year, month, day] = parts;
    if (isNaN(parseInt(year)) || isNaN(parseInt(month)) || isNaN(parseInt(day)))
      return dateStringYYYYMMDD;
    return `${day}/${month}/${year}`;
  }
  return dateStringYYYYMMDD;
}

function isValidDDMMYYYY(dateString) {
  if (!dateString) return false; // Or true if empty is allowed, but forms have 'required' or default logic
  const regex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
  if (!regex.test(dateString)) return false;

  const parts = dateString.match(regex);
  const d = parseInt(parts[1], 10);
  const m = parseInt(parts[2], 10);
  const y = parseInt(parts[3], 10);

  // Basic validation for year, month, day ranges
  if (y < 1000 || y > 3000 || m < 1 || m > 12) return false;

  const daysInMonth = [
    31,
    (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0 ? 29 : 28,
    31,
    30,
    31,
    30,
    31,
    31,
    30,
    31,
    30,
    31,
  ];
  if (d < 1 || d > daysInMonth[m - 1]) return false;

  return true;
}

// autoFormatDateInput function was removed as it is no longer used.

function handleSegmentedDateInput(event) {
    const input = event.target;
    input.value = input.value.replace(/\D/g, ''); // Allow only digits

    // Check if maxLength is a valid number before parsing
    const maxLength = parseInt(input.maxLength, 10);
    if (!isNaN(maxLength) && input.value.length === maxLength) {
        if (input.id === 'expDay') {
            document.getElementById('expMonth')?.focus();
        } else if (input.id === 'expMonth') {
            document.getElementById('expYear')?.focus();
        }
    }
}

// --- UI Message Function (Modal for Success, Panel for Error) ---
let messageTimer = null;
function showUIMessage(message, type = 'success', duration = 3000) {
  if (type === 'success') {
    const modal = document.getElementById('successModal');
    const modalMessage = document.getElementById('successModalMessage');
    if (modal && modalMessage) {
      modalMessage.textContent = message;
      modal.style.display = 'flex';
    } else {
      alert(message);
    }
  } else {
    const messagePanel = document.getElementById('uiMessagePanel');
    if (!messagePanel) {
      alert(message);
      return;
    }
    if (messageTimer) clearTimeout(messageTimer);
    messagePanel.textContent = message;
    messagePanel.className = 'ui-message';
    messagePanel.classList.add(type);
    messagePanel.style.display = 'block';
    messageTimer = setTimeout(() => {
      messagePanel.style.display = 'none';
      messagePanel.textContent = '';
      messagePanel.className = 'ui-message';
    }, duration);
  }
}

// --- Export/Import Functions (Keep Async as they involve fetch) ---
// Individual product export/import functions (exportTransactionsToGoogleSheet, importTransactionsFromGoogleSheet) were removed.

async function handleExportAllData() {
  const loadingOverlay = document.getElementById('loadingOverlay');
  const exportAllButton = document.getElementById('exportAllBtn');

  if (loadingOverlay) loadingOverlay.style.display = 'flex';
  if (exportAllButton) exportAllButton.disabled = true;

  console.log('Starting Export All Data...');
  showUIMessage('Preparing all product data for export...', 'success', 2000);

  const products = getProducts();
  const allLogs = getTransactionLogs();

  if (!products || products.length === 0) {
    showUIMessage('No products available to export.', 'error');
    return;
  }

  const exportData = products.map((product) => {
    const productTransactions = allLogs
      .filter((log) => log.productId === product.id)
      .map((log) => ({
        // Ensure YYYY-MM-DD for dates sent
        date: log.date, // Assuming log.date is already YYYY-MM-DD or DD/MM/YYYY as stored
        type: log.type,
        quantity: log.quantity,
        expirationDate: log.expirationDate || '', // Already YYYY-MM-DD
      }));
    return {
      productId: product.id,
      productName: product.name,
      packaging: product.packaging,
      transactions: productTransactions,
    };
  });

  const payload = {
    action: 'exportAll', // New action for Google Apps Script
    data: exportData,
  };

  const googleScriptURL =
    'https://script.google.com/macros/s/AKfycbwYbA16WcmBr_jQgOF2RimX0rssTnMUcaCXevY8I8q6qzc-Anl96FYoKcNGLbyPwDuV/exec';
  showUIMessage(
    `Exporting data for ${products.length} products...`,
    'success',
    3000
  );

  try {
    const response = await fetch(googleScriptURL, {
      method: 'POST',
      body: JSON.stringify(payload),
      // If your Apps Script is deployed as "execute as me" and "anyone can access",
      // you might not need 'mode: "no-cors"' or specific headers.
      // If it's "user accessing the web app", then CORS might be an issue
      // if not handled in Apps Script with 'Content-Type': 'application/json'.
      // For simplicity, assuming direct POST works as with single export.
    });
    const result = await response.json();
    if (result.status === 'success') {
      showUIMessage(
        result.message ||
          `Export All Data successful. ${products.length} products processed.`,
        'success',
        5000
      );
    } else {
      throw new Error(
        result.message || 'Unknown error during Export All Data.'
      );
    }
  } catch (error) {
    console.error('Export All Data failed:', error);
    showUIMessage(`Export All Data failed: ${error.message}`, 'error', 5000);
  } finally {
    if (loadingOverlay) loadingOverlay.style.display = 'none';
    if (exportAllButton) exportAllButton.disabled = false;
  }
}

async function handleImportAllData() {
  const loadingOverlay = document.getElementById('loadingOverlay');
  const importAllButton = document.getElementById('importAllBtn');

  if (loadingOverlay) loadingOverlay.style.display = 'flex';
  if (importAllButton) importAllButton.disabled = true;

  console.log('Starting Import All Data...');
  showUIMessage(
    'Fetching all data from Google Sheet... Please wait.',
    'success',
    3000
  );

  const googleScriptURL = `https://script.google.com/macros/s/AKfycbwYbA16WcmBr_jQgOF2RimX0rssTnMUcaCXevY8I8q6qzc-Anl96FYoKcNGLbyPwDuV/exec?action=importAll&t=${Date.now()}`;

  try {
    const response = await fetch(googleScriptURL, {
      method: 'GET',
      cache: 'no-cache',
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `HTTP error! status: ${response.status}, details: ${errorText}`
      );
    }
    const importedData = await response.json();

    if (
      !importedData ||
      (importedData.status && importedData.status !== 'success')
    ) {
      // Handle cases where Apps Script returns a structured error like {status: "error", message: "..."}
      const errorMessage =
        importedData.message ||
        'Received non-successful status or invalid data format from Google Sheet.';
      throw new Error(errorMessage);
    }

    // Assuming importedData is an array of products if successful, or apps script wraps it e.g. {status:'success', data: []}
    const productsToProcess = Array.isArray(importedData)
      ? importedData
      : importedData.data || [];

    if (!productsToProcess || productsToProcess.length === 0) {
      showUIMessage(
        'No data received or no products to import from Google Sheet.',
        'success',
        4000
      );
      return;
    }

    showUIMessage(
      `Processing ${productsToProcess.length} products from sheet...`,
      'success',
      2000
    );

    let localProducts = getProducts();
    let localTransactionLogs = getTransactionLogs();
    let localInventory = getInventory();

    for (const importedProduct of productsToProcess) {
      if (!importedProduct.productId || !importedProduct.productName) {
        console.warn(
          'Skipping an imported item due to missing productId or productName:',
          importedProduct
        );
        continue;
      }

      // 1. Update Product List (PRODUCTS_KEY)
      const existingProductIndex = localProducts.findIndex(
        (p) => p.id === importedProduct.productId
      );
      const productDetails = {
        id: importedProduct.productId,
        name: importedProduct.productName,
        packaging: importedProduct.packaging || '',
      };
      if (existingProductIndex !== -1) {
        localProducts[existingProductIndex] = productDetails;
      } else {
        localProducts.push(productDetails);
      }

      // 2. Update Transaction Logs (TRANSACTIONS_KEY)
      //    Remove old logs for this product, then add imported ones.
      localTransactionLogs = localTransactionLogs.filter(
        (log) => log.productId !== importedProduct.productId
      );
      if (
        importedProduct.transactions &&
        Array.isArray(importedProduct.transactions)
      ) {
        importedProduct.transactions.forEach((tx, index) => {
          const newLogEntry = {
            id: `imported-${importedProduct.productId}-${Date.now()}-${index}`,
            productId: importedProduct.productId,
            productName: importedProduct.productName, // Use product name from import
            type: tx.type,
            quantity: parseInt(tx.quantity, 10),
            // Assuming tx.date is DD/MM/YYYY from sheet, convert to YYYY-MM-DD for storage
            date: convertDDMMYYYYtoYYYYMMDD(tx.date),
            // Assuming tx.expirationDate is YYYY-MM-DD from sheet (or null)
            expirationDate: tx.expirationDate || null,
          };
          localTransactionLogs.push(newLogEntry);
        });
      }

      // 3. Rebuild Inventory for this product (INVENTORY_KEY)
      //    Remove old inventory for this product.
      localInventory = localInventory.filter(
        (item) => item.productId !== importedProduct.productId
      );

      // Sort this product's transactions by date (oldest first) to rebuild inventory correctly
      const productLogsSorted = localTransactionLogs
        .filter((log) => log.productId === importedProduct.productId)
        .sort((a, b) => a.date.localeCompare(b.date)); // YYYY-MM-DD sort

      productLogsSorted.forEach((log) => {
        if (log.type === 'in') {
          const invIndex = localInventory.findIndex(
            (item) =>
              item.productId === log.productId &&
              item.expirationDate === log.expirationDate
          );
          if (invIndex !== -1) {
            localInventory[invIndex].quantity += log.quantity;
          } else {
            localInventory.push({
              productId: log.productId,
              quantity: log.quantity,
              expirationDate: log.expirationDate,
            });
          }
        } else if (log.type === 'out') {
          const invIndex = localInventory.findIndex(
            (item) =>
              item.productId === log.productId &&
              item.expirationDate === log.expirationDate
          );
          if (invIndex !== -1) {
            localInventory[invIndex].quantity -= log.quantity;
            // We keep items even if quantity is 0 or negative, as per existing logic.
          } else {
            // This case (out for non-existent batch) should ideally not happen if data is good. Log an error.
            console.warn(
              `Stock out for non-existent batch during import: Product ${log.productId}, Exp ${log.expirationDate}`
            );
          }
        }
      });
    } // End of loop for productsToProcess

    // 4. Save all updated local data
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(localProducts));
    saveTransactionLogs(localTransactionLogs);
    saveInventory(localInventory);

    showUIMessage(
      `Import All Data successful! ${productsToProcess.length} products processed. Local data updated.`,
      'success',
      5000
    );

    // 5. Refresh product list on index page
    if (document.getElementById('productListContainer')) {
      displayProductsOnIndexPage();
    }
  } catch (error) {
    console.error('Import All Data failed:', error);
    showUIMessage(`Import All Data failed: ${error.message}`, 'error', 6000);
  } finally {
    if (loadingOverlay) loadingOverlay.style.display = 'none';
    if (importAllButton) importAllButton.disabled = false;
  }
}

// --- Form Handlers (No longer Async for core logic) ---
function handleStockIn(event) {
  event.preventDefault();
  const params = new URLSearchParams(window.location.search);
  const productId = params.get('id');
  if (!productId) {
    showUIMessage('Error: Product ID not found. Cannot add stock.', 'error');
    return;
  }
  const quantityInput = document.getElementById('stockInQuantity');
  // Get values from segmented date inputs
  const expDayInput = document.getElementById('expDay');
  const expMonthInput = document.getElementById('expMonth');
  const expYearInput = document.getElementById('expYear');
  const transactionDateInput = document.getElementById('stockInDate');

  const quantity = parseInt(quantityInput.value, 10);
  const dayVal = expDayInput.value;
  const monthVal = expMonthInput.value;
  const yearVal = expYearInput.value;
  const transactionDateString = transactionDateInput.value;

  if (isNaN(quantity) || quantity <= 0) {
    showUIMessage(
      'Please enter a valid quantity (must be a positive number).',
      'error'
    );
    return;
  }

  // Handle Empty Fields for expiration date
  if (!dayVal || !monthVal || !yearVal) {
    showUIMessage('Expiration date fields cannot be empty.', 'error');
    return;
  }

  // Construct Date String for Validation (DD/MM/YYYY)
  const paddedDay = dayVal.padStart(2, '0');
  const paddedMonth = monthVal.padStart(2, '0');
  // Year should be 4 digits as per HTML maxlength and subsequent validation.
  const expirationDateStringForValidation = `${paddedDay}/${paddedMonth}/${yearVal}`;

  // Validate Constructed Date
  if (!isValidDDMMYYYY(expirationDateStringForValidation)) {
    showUIMessage(
      'Please enter a valid expiration date in DD/MM/YYYY format (e.g., 01/01/2025).',
      'error'
    );
    return;
  }

  // Convert to YYYY-MM-DD for Storage (after successful validation)
  // The expirationDateStringForValidation is already padded and validated.
  const expirationDate = convertDDMMYYYYtoYYYYMMDD(expirationDateStringForValidation);


  let transactionDate = ''; // To store YYYY-MM-DD
  if (transactionDateString) {
    // If user provided a date
    if (!isValidDDMMYYYY(transactionDateString)) {
      showUIMessage(
        'Please enter a valid transaction date in DD/MM/YYYY format or leave it blank for today.',
        'error'
      );
      return;
    }
    transactionDate = convertDDMMYYYYtoYYYYMMDD(transactionDateString);
  } else {
    // Default to today if blank
    transactionDate = new Date().toISOString().split('T')[0];
  }

  addStock(productId, quantity, expirationDate, transactionDate); // Now synchronous
  quantityInput.value = '';
  // Clear segmented date inputs
  expDayInput.value = '';
  expMonthInput.value = '';
  expYearInput.value = '';
  transactionDateInput.value = formatDateToDDMMYYYY(
    new Date().toISOString().split('T')[0]
  );
  displayProductDetails(); // Refresh details
  showUIMessage('Stock added successfully!', 'success');
}

function handleStockOut(event) {
  event.preventDefault();
  const params = new URLSearchParams(window.location.search);
  const productId = params.get('id');
  if (!productId) {
    showUIMessage('Error: Product ID not found. Cannot remove stock.', 'error');
    return;
  }
  const batchSelect = document.getElementById('stockOutBatchSelect');
  const quantityInput = document.getElementById('stockOutQuantity');
  const transactionDateInput = document.getElementById('stockOutDate');
  const selectedExpirationDate = batchSelect.value;
  const quantity = parseInt(quantityInput.value, 10);
  const transactionDateString = transactionDateInput.value;

  if (!selectedExpirationDate) {
    showUIMessage('Please select a batch to remove stock from.', 'error');
    return;
  }
  if (isNaN(quantity) || quantity <= 0) {
    showUIMessage(
      'Please enter a valid quantity (must be a positive number).',
      'error'
    );
    return;
  }
  const selectedOption = batchSelect.options[batchSelect.selectedIndex];
  const availableQuantity = parseInt(
    selectedOption.dataset.availableQuantity,
    10
  );
  if (quantity > availableQuantity) {
    showUIMessage(
      `Cannot remove ${quantity} Ctns. Only ${availableQuantity} Ctns available in the selected batch.`,
      'error'
    );
    return;
  }

  let transactionDate = ''; // To store YYYY-MM-DD
  if (transactionDateString) {
    // If user provided a date
    if (!isValidDDMMYYYY(transactionDateString)) {
      showUIMessage(
        'Please enter a valid transaction date in DD/MM/YYYY format or leave it blank for today.',
        'error'
      );
      return;
    }
    transactionDate = convertDDMMYYYYtoYYYYMMDD(transactionDateString);
  } else {
    // Default to today if blank
    transactionDate = new Date().toISOString().split('T')[0];
  }

  const success = removeStock(
    productId,
    quantity,
    selectedExpirationDate,
    transactionDate
  ); // Now synchronous
  if (success) {
    quantityInput.value = '';
    transactionDateInput.value = formatDateToDDMMYYYY(
      new Date().toISOString().split('T')[0]
    );
    displayProductDetails(); // Refresh details
    showUIMessage('Stock removed successfully!', 'success');

    // Refresh product specific history if it's visible
    const productSpecificHistoryContainer = document.getElementById('productSpecificHistoryContainer');
    if (productSpecificHistoryContainer && productSpecificHistoryContainer.style.display !== 'none') {
      if (productId) { // productId is already defined in this function's scope
        displayProductSpecificHistory(productId);
      }
    }
  }
  // Error messages are now handled within removeStock or by its return value
}

// --- UI Display Functions (No longer Async for core logic) ---
function displayProductsOnIndexPage() {
  const productListContainer = document.getElementById('productListContainer');
  if (!productListContainer) return;
  const products = getProducts(); // Synchronous
  productListContainer.innerHTML = '';
  if (!products || products.length === 0) {
    productListContainer.textContent = 'No products available.';
    return;
  }
  const ul = document.createElement('ul');
  products.forEach((product) => {
    const li = document.createElement('li');
    li.dataset.productId = product.id;
    const nameSpan = document.createElement('span');
    nameSpan.textContent = product.name;
    nameSpan.className = 'product-name-display';
    li.appendChild(nameSpan);
    li.addEventListener('click', function () {
      window.location.href = `product.html?id=${this.dataset.productId}`;
    });
    ul.appendChild(li);
  });
  productListContainer.appendChild(ul);
}

function displayProductDetails() {
  const productNameEl = document.getElementById('productName');
  const productPackagingEl = document.getElementById('productPackaging');
  const productItemCodeEl = document.getElementById('productItemCode');
  const stockDetailsContainer = document.getElementById(
    'stockDetailsContainer'
  );
  const pageTitleEl = document.getElementById('pageTitle');

  if (!productNameEl || !stockDetailsContainer || !pageTitleEl) return;

  const params = new URLSearchParams(window.location.search);
  const productId = params.get('id');
  if (!productId) {
    pageTitleEl.textContent = 'Error';
    productNameEl.textContent = 'Product ID not found in URL.';
    stockDetailsContainer.innerHTML = '';
    populateStockOutBatchSelector();
    return;
  }

  const product = getProductById(productId); // Synchronous
  if (!product) {
    pageTitleEl.textContent = 'Error';
    productNameEl.textContent = `Product with ID ${productId} not found.`;
    stockDetailsContainer.innerHTML = '';
    populateStockOutBatchSelector();
    return;
  }

  pageTitleEl.textContent = product.name;
  productNameEl.textContent = product.name;
  productPackagingEl.textContent = product.packaging;
  productItemCodeEl.textContent = product.id;

  const allInventory = getInventory(); // Synchronous
  const productInventory = allInventory.filter(
    (item) => item.productId === productId
  );
  stockDetailsContainer.innerHTML = '';
  if (
    productInventory.length === 0 ||
    productInventory.every((item) => item.quantity === 0)
  ) {
    stockDetailsContainer.textContent = 'No stock available for this product.';
  } else {
    const ul = document.createElement('ul');
    productInventory.forEach((item) => {
      if (item.quantity > 0) {
        const li = document.createElement('li');
        li.innerHTML = `<strong>${
          item.quantity
        } Ctns</strong> EXP Date : <strong>${formatDateToDDMMYYYY(
          item.expirationDate
        )}</strong>`;
        ul.appendChild(li);
      }
    });
    if (ul.children.length === 0) {
      stockDetailsContainer.textContent =
        'No stock available for this product (all batches have 0 quantity).';
    } else {
      stockDetailsContainer.appendChild(ul);
    }
  }
  populateStockOutBatchSelector();
}

function convertDDMMYYYYtoYYYYMMDD(dateString) {
  if (!dateString || typeof dateString !== 'string') return dateString;
  const parts = dateString.split('/');
  if (parts.length === 3) {
    const [day, month, year] = parts;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  return dateString;
}

// Fixed balance calculation in displayProductSpecificHistory
function displayProductSpecificHistory(productId) {
  const historyContainer = document.getElementById(
    'productSpecificHistoryContainer'
  );
  if (!historyContainer) return;

  const allLogs = getTransactionLogs();
  const productLogs = allLogs.filter((log) => log.productId === productId);

  // Sort by date (newest first), then by ID for consistent ordering
  productLogs.sort((a, b) => {
    // Convert dates to YYYY-MM-DD format for proper comparison
    const dateA = convertDDMMYYYYtoYYYYMMDD(a.date);
    const dateB = convertDDMMYYYYtoYYYYMMDD(b.date);
    const dateComparison = dateB.localeCompare(dateA); // Newest first
    if (dateComparison !== 0) return dateComparison;
    return (b.id || '').localeCompare(a.id || ''); // Fallback to ID comparison
  });

  // Calculate current total stock from inventory
  const allInventory = getInventory();
  let currentTotalStock = 0;
  allInventory
    .filter((item) => item.productId === productId)
    .forEach((item) => (currentTotalStock += item.quantity));

  // Calculate running balance (working backwards from current stock)
  if (productLogs.length > 0) {
    // Start with current stock for the newest transaction
    productLogs[0].balanceAfterTransaction = currentTotalStock;

    // Work backwards through the sorted logs
    for (let i = 1; i < productLogs.length; i++) {
      const currentLog = productLogs[i];
      const newerLog = productLogs[i - 1];

      // Calculate what the balance was before the newer transaction
      let balanceBeforeNewerTransaction = newerLog.balanceAfterTransaction;
      if (newerLog.type === 'in') {
        balanceBeforeNewerTransaction -= newerLog.quantity;
      } else if (newerLog.type === 'out') {
        balanceBeforeNewerTransaction += newerLog.quantity;
      }

      currentLog.balanceAfterTransaction = balanceBeforeNewerTransaction;
    }
  }

  historyContainer.innerHTML = '';
  if (productLogs.length === 0) {
    historyContainer.textContent =
      'No transaction history available for this product.';
    return;
  }

  const table = document.createElement('table');
  table.id = 'productHistoryTable';
  const thead = table.createTHead();
  const headerRow = thead.insertRow();
  const headers = ['Date', 'Type', 'Quantity', 'Expiration Date', 'Balance'];
  headers.forEach((headerText) => {
    const th = document.createElement('th');
    th.textContent = headerText;
    headerRow.appendChild(th);
  });
  const tbody = table.createTBody();
  productLogs.forEach((log) => {
    const row = tbody.insertRow();
    row.insertCell().textContent = formatDateToDDMMYYYY(log.date);
    row.insertCell().textContent = log.type.toUpperCase();
    row.insertCell().textContent = log.quantity;
    row.insertCell().textContent = log.expirationDate
      ? formatDateToDDMMYYYY(log.expirationDate)
      : 'N/A';
    row.insertCell().textContent = log.balanceAfterTransaction;
  });
  historyContainer.appendChild(table);
}

function populateStockOutBatchSelector() {
  const batchSelect = document.getElementById('stockOutBatchSelect');
  if (!batchSelect) return;
  const params = new URLSearchParams(window.location.search);
  const productId = params.get('id');
  if (!productId) return;

  const allInventory = getInventory(); // Synchronous
  const productInventory = allInventory.filter(
    (item) => item.productId === productId && item.quantity > 0
  );
  batchSelect.innerHTML = '';
  const placeholderOption = document.createElement('option');
  placeholderOption.value = '';
  placeholderOption.textContent = '-- Select | 选择剩余库存 --';
  placeholderOption.disabled = true;
  placeholderOption.selected = true;
  batchSelect.appendChild(placeholderOption);
  if (productInventory.length === 0) {
    placeholderOption.textContent = 'No stock available';
    return;
  }
  productInventory.forEach((item) => {
    const option = document.createElement('option');
    option.value = item.expirationDate;
    option.dataset.availableQuantity = item.quantity;
    option.textContent = `${
      item.quantity
    } Ctns (Expires: ${formatDateToDDMMYYYY(item.expirationDate)})`;
    batchSelect.appendChild(option);
  });
}

// --- Event Listeners & Initialization ---
function initProductPageEventListeners() {
  const stockInForm = document.getElementById('stockInForm');
  if (stockInForm && !stockInForm.dataset.listenerAttachedS) {
    stockInForm.addEventListener('submit', handleStockIn); // Synchronous call
    stockInForm.dataset.listenerAttachedS = 'true';
  }
  const stockOutForm = document.getElementById('stockOutForm');
  if (stockOutForm && !stockOutForm.dataset.listenerAttachedO) {
    stockOutForm.addEventListener('submit', handleStockOut); // Synchronous call
    stockOutForm.dataset.listenerAttachedO = 'true';
  }

  const toggleBtn = document.getElementById('toggleProductHistoryBtn');
  const productHistoryContainer = document.getElementById(
    'productSpecificHistoryContainer'
  );
  const params = new URLSearchParams(window.location.search);
  const currentProductId = params.get('id');

  if (
    toggleBtn &&
    productHistoryContainer &&
    currentProductId &&
    !toggleBtn.dataset.listenerAttachedH
  ) {
    toggleBtn.addEventListener('click', () => {
      // No longer async
      const isHidden = productHistoryContainer.style.display === 'none';
      if (isHidden) {
        displayProductSpecificHistory(currentProductId); // Synchronous call
        productHistoryContainer.style.display = 'block';
        toggleBtn.textContent = 'Hide Record | 关闭记录';
      } else {
        productHistoryContainer.style.display = 'none';
        toggleBtn.textContent = 'View Record | 查看记录';
      }
    });
    toggleBtn.dataset.listenerAttachedH = 'true';
  }

  const toggleStockInBtn = document.getElementById('toggleStockInFormBtn');
  const stockInFormEl = document.getElementById('stockInForm');
  if (
    toggleStockInBtn &&
    stockInFormEl &&
    !toggleStockInBtn.dataset.listenerAttachedSI
  ) {
    toggleStockInBtn.addEventListener('click', () => {
      const isHidden =
        stockInFormEl.style.display === 'none' ||
        stockInFormEl.style.display === '';
      if (isHidden) {
        stockInFormEl.style.display = 'block';
        toggleStockInBtn.textContent = 'Hide Stock In Form | 关闭进货表';
        const stockInDateInput = document.getElementById('stockInDate');
        if (stockInDateInput && !stockInDateInput.value) {
          stockInDateInput.value = formatDateToDDMMYYYY(
            new Date().toISOString().split('T')[0]
          );
        }
      } else {
        stockInFormEl.style.display = 'none';
        toggleStockInBtn.textContent = 'Stock In | 进货';
      }
    });
    toggleStockInBtn.dataset.listenerAttachedSI = 'true';
  }

  const toggleStockOutBtn = document.getElementById('toggleStockOutFormBtn');
  const stockOutFormEl = document.getElementById('stockOutForm');
  if (
    toggleStockOutBtn &&
    stockOutFormEl &&
    !toggleStockOutBtn.dataset.listenerAttachedSO
  ) {
    toggleStockOutBtn.addEventListener('click', () => {
      const isHidden =
        stockOutFormEl.style.display === 'none' ||
        stockOutFormEl.style.display === '';
      if (isHidden) {
        stockOutFormEl.style.display = 'block';
        toggleStockOutBtn.textContent = 'Hide Stock Out Form | 关闭出货表';
        const stockOutDateInput = document.getElementById('stockOutDate');
        if (stockOutDateInput && !stockOutDateInput.value) {
          stockOutDateInput.value = formatDateToDDMMYYYY(
            new Date().toISOString().split('T')[0]
          );
        }
      } else {
        stockOutFormEl.style.display = 'none';
        toggleStockOutBtn.textContent = 'Stock Out | 出货';
      }
    });
    toggleStockOutBtn.dataset.listenerAttachedSO = 'true';
  }

  const successModal = document.getElementById('successModal');
  const successModalOkButton = document.getElementById('successModalOkButton');
  if (
    successModal &&
    successModalOkButton &&
    !successModalOkButton.dataset.listenerAttachedM
  ) {
    successModalOkButton.addEventListener('click', () => {
      successModal.style.display = 'none';
    });
    successModalOkButton.dataset.listenerAttachedM = 'true';
  }

  // Event listeners for exportToSheetBtn and importFromSheetBtn were removed.

  // The event listener for 'stockInExpirationDate' that called autoFormatDateInput was removed.

  const expDayField = document.getElementById('expDay');
  const expMonthField = document.getElementById('expMonth');
  const expYearField = document.getElementById('expYear');

  if (expDayField && !expDayField.dataset.listenerAttachedSeg) {
    expDayField.addEventListener('input', handleSegmentedDateInput);
    expDayField.dataset.listenerAttachedSeg = 'true';
  }
  if (expMonthField && !expMonthField.dataset.listenerAttachedSeg) {
    expMonthField.addEventListener('input', handleSegmentedDateInput);
    expMonthField.dataset.listenerAttachedSeg = 'true';
  }
  if (expYearField && !expYearField.dataset.listenerAttachedSeg) {
    expYearField.addEventListener('input', handleSegmentedDateInput);
    expYearField.dataset.listenerAttachedSeg = 'true';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  // No longer async
  // Removed IndexedDB initialization
  // console.log("DB initialization removed from DOMContentLoaded for LS mode.");

  const productListContainer = document.getElementById('productListContainer');
  const stockDetailsContainer = document.getElementById(
    'stockDetailsContainer'
  );

  if (productListContainer) {
    displayProductsOnIndexPage(); // Synchronous call
  } else if (stockDetailsContainer) {
    displayProductDetails(); // Synchronous call
    initProductPageEventListeners();
  }

  // Event listeners for global export/import buttons (on index.html)
  const exportAllButton = document.getElementById('exportAllBtn');
  if (exportAllButton) {
    exportAllButton.addEventListener('click', async () => {
      const password = prompt('Enter password to Export All Data:');
      if (password !== '1234') {
        showUIMessage('Incorrect password.', 'error');
        return;
      }
      await handleExportAllData();
    });
  }

  const importAllButton = document.getElementById('importAllBtn');
  if (importAllButton) {
    importAllButton.addEventListener('click', async () => {
      const password = prompt('Enter password to Import All Data:');
      if (password !== '1234') {
        showUIMessage('Incorrect password.', 'error');
        return;
      }
      if (
        confirm(
          'Importing all data will overwrite existing data for products found in the sheet and add new ones. Are you sure you want to proceed?'
        )
      ) {
        await handleImportAllData();
      } else {
        showUIMessage('Import All Data cancelled by user.', 'success');
      }
    });
  }
});

getProducts(); // Restore global call for LS population if needed
