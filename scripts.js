// script.js

// --- Service Worker Registration ---
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then(registration => {
          console.log('Service Worker: Registered successfully. Scope is:', registration.scope);
        })
        .catch(error => {
          console.error('Service Worker: Registration failed:', error);
        });
    });
  }
  
  console.log("script.js loaded");
  
  // --- Local Storage Keys ---
  const PRODUCTS_KEY = 'products';
  const INVENTORY_KEY = 'inventory';
  const TRANSACTIONS_KEY = 'transactionLogs';
  
  // --- Initial Product Data ---
  const initialProducts = [
      { id: '90002', name: 'FOODFARE 苏东丸 - CUTTLEFISH BALL (10kg/ctn)', packaging: '1kg x 10pkt' },
      { id: '90003', name: 'FOODFARE 鱼丸 - FISH BALL (10kg/ctn)', packaging: '1kg x 10pkt' },
      { id: '90004', name: 'FOODFARE 圆饼 - ROUND FISH CAKE (10kg/ctn)', packaging: '1kg x 10pkt' },
      { id: '90005', name: 'FOODFARE 切片 - SLICED FISH CAKE (10kg/ctn)', packaging: '1kg x 10pkt' },
      { id: '90006', name: 'FOODFARE 泰式鱼饼 - THAI FISH CAKE (10kg/ctn)', packaging: '1kg x 10pkt' },
      { id: '90007', name: 'FOODFARE 虾丸 - PRAWN BALL (10kg/ctn)', packaging: '1kg x 10pkt' },
      { id: '90008', name: 'FOODFARE 海鲜条 - SEAFOOD STICK (10kg/ctn)', packaging: '1kg x 10pkt' },
      { id: '90009', name: 'FOODFARE 蟹肉饼 - CRAB MEAT CAKE (10kg/ctn)', packaging: '1kg x 10pkt' },
      { id: '90010', name: 'FOODFARE 香菇丸 - MUSHROOM BALL (10kg/ctn)', packaging: '1kg x 10pkt' },
      { id: '90021', name: 'FOODFARE 龙虾丸 - LOBSTER BALL (10kg/ctn)', packaging: '1kg x 10pkt' },
      { id: '90023', name: 'FOODFARE 五香 - NGOH HIANG (10kg/ctn)', packaging: '1kg x 10pkt' },
      { id: '90024', name: 'FOODFARE 香脆鱼块 - CHUNKY FISH NUGGET (10kg/ctn)', packaging: '1kg x 10pkt' },
      { id: '90025', name: 'FOODFARE 香脆鱼片 - BREADED FISH CHIP [FISH PATTY] (10kg/ctn', packaging: '1kg x 10pkt' }
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
      return products.find(product => product.id === productId) || null;
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
  
  function logTransaction(productId, productName, type, quantity, transactionDate, expirationDate) {
      const logs = getTransactionLogs(); // Uses LS-based getTransactionLogs
      const newLog = {
          id: Date.now().toString() + '-' + Math.random().toString(36).substr(2, 9), // Simple unique ID
          productId,
          productName,
          type,
          quantity,
          date: transactionDate,
          expirationDate: expirationDate || null
      };
      logs.push(newLog);
      saveTransactionLogs(logs); // Uses LS-based saveTransactionLogs
  }
  
  function addStock(productId, quantity, expirationDate, transactionDate) {
      const inventory = getInventory(); // LS-based
      const product = getProductById(productId); // LS-based
      if (!product) {
          console.error(`Product with ID ${productId} not found.`);
          showUIMessage(`Product with ID ${productId} not found. Cannot add stock.`, 'error');
          return;
      }
  
      quantity = parseInt(quantity, 10);
      if (isNaN(quantity) || quantity <= 0) { // Validation kept for robustness
          showUIMessage("Invalid quantity for addStock.", 'error');
          return;
      }
  
      let itemUpdated = false;
      for (let i = 0; i < inventory.length; i++) {
          if (inventory[i].productId === productId && inventory[i].expirationDate === expirationDate) {
              inventory[i].quantity += quantity;
              itemUpdated = true;
              break;
          }
      }
  
      if (!itemUpdated) {
          inventory.push({ 
              productId,
              quantity,
              expirationDate
              // No 'id' field for LS inventory items, not needed for this simple structure
          });
      }
  
      saveInventory(inventory); // LS-based
      logTransaction(productId, product.name, 'in', quantity, transactionDate, expirationDate); // LS-based
      console.log(`Stock added: ${quantity} of ${product.name} (Exp: ${expirationDate}) on ${transactionDate}`);
  }
  
  function removeStock(productId, quantity, expirationDate, transactionDate) {
      const inventory = getInventory(); // LS-based
      const product = getProductById(productId); // LS-based
      if (!product) {
          console.error(`Product with ID ${productId} not found.`);
          showUIMessage(`Product with ID ${productId} not found. Cannot remove stock.`, 'error');
          return false;
      }
  
      quantity = parseInt(quantity, 10);
      if (isNaN(quantity) || quantity <= 0) { // Validation kept for robustness
          showUIMessage("Invalid quantity for removeStock.", 'error');
          return false;
      }
  
      let itemIndex = -1;
      for (let i = 0; i < inventory.length; i++) {
          if (inventory[i].productId === productId && inventory[i].expirationDate === expirationDate) {
              itemIndex = i;
              break;
          }
      }
  
      if (itemIndex !== -1) {
          if (inventory[itemIndex].quantity >= quantity) {
              inventory[itemIndex].quantity -= quantity;
              // If quantity becomes 0, the item remains in LS (original behavior)
              saveInventory(inventory); // LS-based
              logTransaction(productId, product.name, 'out', quantity, transactionDate, expirationDate); // LS-based
              console.log(`Stock removed: ${quantity} of ${product.name} (Exp: ${expirationDate}) on ${transactionDate}`);
              return true;
          } else {
              showUIMessage(`Not enough stock for ${product.name} (Exp: ${expirationDate}). Available: ${inventory[itemIndex].quantity}, Tried to remove: ${quantity}`, 'error');
              return false;
          }
      } else {
          showUIMessage(`Stock item not found for ${product.name} (Exp: ${expirationDate}).`, 'error');
          return false;
      }
  }
  
  // --- Date Formatting Helper ---
  function formatDateToDDMMYYYY(dateStringYYYYMMDD) {
      if (!dateStringYYYYMMDD || typeof dateStringYYYYMMDD !== 'string') return dateStringYYYYMMDD;
      const parts = dateStringYYYYMMDD.split('-');
      if (parts.length === 3) {
          const [year, month, day] = parts;
          if (isNaN(parseInt(year)) || isNaN(parseInt(month)) || isNaN(parseInt(day))) return dateStringYYYYMMDD;
          return `${day}/${month}/${year}`;
      }
      return dateStringYYYYMMDD;
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
  async function exportTransactionsToGoogleSheet(productId, productName) {
      if (!productId || !productName) {
          showUIMessage('Product information is missing for export.', 'error');
          return;
      }
      showUIMessage('Fetching transactions for export...', 'success', 1500); 
  
      const allLogs = getTransactionLogs(); // Now synchronous LS call
      const productLogs = allLogs.filter(log => log.productId === productId);
  
      if (!productLogs || productLogs.length === 0) {
          showUIMessage('No transaction history available for this product to export.', 'error', 4000);
          return;
      }
  
      const transactionsForExport = productLogs.map(log => ({
          date: log.date, 
          type: log.type,
          quantity: log.quantity,
          expirationDate: log.expirationDate || '',
      }));
  
      const payload = {
          productName: productName,
          productId: productId,
          transactions: transactionsForExport
      };
  
      const googleScriptURL = 'https://script.google.com/macros/s/AKfycbwYbA16WcmBr_jQgOF2RimX0rssTnMUcaCXevY8I8q6qzc-Anl96FYoKcNGLbyPwDuV/exec';
      showUIMessage(`Exporting ${productLogs.length} transactions for ${productName}...`, 'success', 3000);
  
      try {
          const response = await fetch(googleScriptURL, {
            method: 'POST',
            body: JSON.stringify(payload) // Note: no headers needed
        });
          const result = await response.json(); 
          if (result.status === 'success') {
              showUIMessage(result.message || `Export successful for ${productName}.`, 'success', 5000);
          } else {
              throw new Error(result.message || 'Unknown error during export.');
          }
      } catch (error) {
          showUIMessage(`Export failed: ${error.message}`, 'error', 5000);
      }
  }
  
  async function importTransactionsFromGoogleSheet(productId) {
    console.log('Starting importTransactionsFromGoogleSheet for productId:', productId);
    
    if (!confirm(`This will REPLACE all local transactions for this product with data from the Google Sheet. Are you sure?`)) {
        console.log('User cancelled the import operation');
        return;
    }
    
    showUIMessage('Importing transactions... Please wait.', 'success', 2000);
    
    const googleScriptURL = `https://script.google.com/macros/s/AKfycbwYbA16WcmBr_jQgOF2RimX0rssTnMUcaCXevY8I8q6qzc-Anl96FYoKcNGLbyPwDuV/exec?action=import&productId=${productId}&t=${Date.now()}`;
    console.log('Constructed Google Script URL:', googleScriptURL);

    try {
        console.log('Starting fetch request to Google Script...');
        const response = await fetch(googleScriptURL, { 
            method: 'GET',
            cache: 'no-cache'
        });
        
        console.log('Received response, status:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('HTTP error details:', errorText);
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('Parsed JSON response:', result);

        if (result.status === 'success' && Array.isArray(result.data)) {
            console.log('Success response received with data array, length:', result.data.length);
            
            if (result.data.length === 0) {
                console.log('No transactions found in sheet for this product');
                showUIMessage('No transactions found in the sheet for this product.', 'error', 4000);
                return;
            }
            
            // Step 1: Clear existing transactions for this product
            let allLogs = getTransactionLogs();
            console.log('Current local transaction logs (before filtering):', allLogs);
            
            const otherProductLogs = allLogs.filter(log => log.productId !== productId);
            console.log('Filtered logs (other products):', otherProductLogs);
            
            // Step 2: Clear existing inventory for this product
            let allInventory = getInventory();
            const otherProductInventory = allInventory.filter(item => item.productId !== productId);
            console.log('Cleared inventory for product:', productId);
            
            // Step 3: Process imported transactions and rebuild inventory
            const newLogsForStorage = [...otherProductLogs];
            const newInventoryForStorage = [...otherProductInventory];
            
            // Sort transactions by date (oldest first) to properly rebuild inventory
            const sortedTransactions = result.data.sort((a, b) => {
                // Convert DD/MM/YYYY to YYYY-MM-DD for proper date comparison
                const dateA = convertDDMMYYYYtoYYYYMMDD(a.date);
                const dateB = convertDDMMYYYYtoYYYYMMDD(b.date);
                return dateA.localeCompare(dateB);
            });
            
            console.log('Processing sorted transactions from sheet:');
            sortedTransactions.forEach((tx, index) => {
                console.log(`Processing transaction ${index + 1}:`, tx);
                
                // Create log entry
                const newLogEntry = {
                    id: `import-${Date.now()}-${index}`, // Generate unique ID for imported transactions
                    productId: productId,
                    productName: tx.productName || 'Unknown Product',
                    type: tx.type,
                    quantity: parseInt(tx.quantity, 10),
                    date: tx.date, // Keep DD/MM/YYYY format from backend
                    expirationDate: tx.expirationDate || null
                };
                console.log(`Created new log entry ${index + 1}:`, newLogEntry);
                
                newLogsForStorage.push(newLogEntry);
                
                // Update inventory based on transaction type
                if (tx.type === 'in') {
                    // Add to inventory
                    const existingInventoryIndex = newInventoryForStorage.findIndex(
                        item => item.productId === productId && item.expirationDate === tx.expirationDate
                    );
                    
                    if (existingInventoryIndex !== -1) {
                        // Update existing batch
                        newInventoryForStorage[existingInventoryIndex].quantity += parseInt(tx.quantity, 10);
                    } else {
                        // Create new batch
                        newInventoryForStorage.push({
                            productId: productId,
                            quantity: parseInt(tx.quantity, 10),
                            expirationDate: tx.expirationDate
                        });
                    }
                } else if (tx.type === 'out') {
                    // Remove from inventory
                    const existingInventoryIndex = newInventoryForStorage.findIndex(
                        item => item.productId === productId && item.expirationDate === tx.expirationDate
                    );
                    
                    if (existingInventoryIndex !== -1) {
                        newInventoryForStorage[existingInventoryIndex].quantity -= parseInt(tx.quantity, 10);
                        // Keep items with 0 quantity (as per original behavior)
                    }
                }
            });
            
            // Step 4: Save updated data
            console.log('Final logs array to be saved:', newLogsForStorage);
            console.log('Final inventory array to be saved:', newInventoryForStorage);
            
            saveTransactionLogs(newLogsForStorage);
            saveInventory(newInventoryForStorage);
            
            console.log(`Successfully saved ${result.data.length} new transactions and updated inventory`);
            
            showUIMessage(`Successfully imported ${result.data.length} transactions and updated inventory.`, 'success', 5000);
            
            // Refresh displays
            displayProductDetails();
            const productHistoryContainer = document.getElementById('productSpecificHistoryContainer');
            if (productHistoryContainer && productHistoryContainer.style.display !== 'none') {
                console.log('Refreshing product specific history display');
                displayProductSpecificHistory(productId);
            }
        } else {
            console.error('Unexpected response format or error:', result);
            throw new Error(result.message || 'Failed to import data or data format error.');
        }
    } catch (error) {
        console.error('Import failed with error:', error);
        showUIMessage(`Import failed: ${error.message}`, 'error', 5000);
    }
    
    console.log('Import process completed');
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
      const expirationDateInput = document.getElementById('stockInExpirationDate');
      const transactionDateInput = document.getElementById('stockInDate');
      const quantity = parseInt(quantityInput.value, 10);
      const expirationDate = expirationDateInput.value;
      let transactionDate = transactionDateInput.value;
  
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (isNaN(quantity) || quantity <= 0) {
          showUIMessage('Please enter a valid quantity (must be a positive number).', 'error');
          return;
      }
      if (!expirationDate || !dateRegex.test(expirationDate)) {
          showUIMessage('Please enter a valid expiration date in YYYY-MM-DD format.', 'error');
          return;
      }
      if (transactionDate && !dateRegex.test(transactionDate)) {
          showUIMessage('Please enter a valid transaction date in YYYY-MM-DD format or leave it blank.', 'error');
          return;
      }
      if (!transactionDate) {
          transactionDate = new Date().toISOString().split('T')[0];
      }
  
      addStock(productId, quantity, expirationDate, transactionDate); // Now synchronous
      quantityInput.value = '';
      expirationDateInput.value = '';
      transactionDateInput.value = '';
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
      let transactionDate = transactionDateInput.value;
  
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!selectedExpirationDate) {
          showUIMessage('Please select a batch to remove stock from.', 'error');
          return;
      }
      if (isNaN(quantity) || quantity <= 0) {
          showUIMessage('Please enter a valid quantity (must be a positive number).', 'error');
          return;
      }
      const selectedOption = batchSelect.options[batchSelect.selectedIndex];
      const availableQuantity = parseInt(selectedOption.dataset.availableQuantity, 10);
      if (quantity > availableQuantity) {
          showUIMessage(`Cannot remove ${quantity} Ctns. Only ${availableQuantity} Ctns available in the selected batch.`, 'error');
          return;
      }
      if (transactionDate && !dateRegex.test(transactionDate)) {
          showUIMessage('Please enter a valid transaction date in YYYY-MM-DD format or leave it blank.', 'error');
          return;
      }
      if (!transactionDate) {
          transactionDate = new Date().toISOString().split('T')[0];
      }
  
      const success = removeStock(productId, quantity, selectedExpirationDate, transactionDate); // Now synchronous
      if (success) {
          quantityInput.value = '';
          transactionDateInput.value = '';
          displayProductDetails(); // Refresh details
          showUIMessage('Stock removed successfully!', 'success');
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
      products.forEach(product => {
          const li = document.createElement('li');
          li.dataset.productId = product.id;
          const nameSpan = document.createElement('span');
          nameSpan.textContent = product.name;
          nameSpan.className = 'product-name-display';
          li.appendChild(nameSpan);
          li.addEventListener('click', function() {
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
      const stockDetailsContainer = document.getElementById('stockDetailsContainer');
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
      const productInventory = allInventory.filter(item => item.productId === productId);
      stockDetailsContainer.innerHTML = '';
      if (productInventory.length === 0 || productInventory.every(item => item.quantity === 0)) {
          stockDetailsContainer.textContent = 'No stock available for this product.';
      } else {
          const ul = document.createElement('ul');
          productInventory.forEach(item => {
              if (item.quantity > 0) {
                  const li = document.createElement('li');
                  li.innerHTML = `<strong>${item.quantity} Ctns</strong> EXP Date : <strong>${formatDateToDDMMYYYY(item.expirationDate)}</strong>`;
                  ul.appendChild(li);
              }
          });
          if (ul.children.length === 0) {
               stockDetailsContainer.textContent = 'No stock available for this product (all batches have 0 quantity).';
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
    const historyContainer = document.getElementById('productSpecificHistoryContainer');
    if (!historyContainer) return;

    const allLogs = getTransactionLogs();
    const productLogs = allLogs.filter(log => log.productId === productId);

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
    allInventory.filter(item => item.productId === productId)
              .forEach(item => currentTotalStock += item.quantity);

    // Calculate running balance (working backwards from current stock)
    if (productLogs.length > 0) {
        // Start with current stock for the newest transaction
        productLogs[0].balanceAfterTransaction = currentTotalStock;
        
        // Work backwards through the sorted logs
        for (let i = 1; i < productLogs.length; i++) {
            const currentLog = productLogs[i];
            const newerLog = productLogs[i-1];
            
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
        historyContainer.textContent = 'No transaction history available for this product.';
        return;
    }

    const table = document.createElement('table');
    table.id = 'productHistoryTable';
    const thead = table.createTHead();
    const headerRow = thead.insertRow();
    const headers = ['Date', 'Type', 'Quantity', 'Expiration Date', 'Balance'];
    headers.forEach(headerText => {
        const th = document.createElement('th');
        th.textContent = headerText;
        headerRow.appendChild(th);
    });
    const tbody = table.createTBody();
    productLogs.forEach(log => {
        const row = tbody.insertRow();
        row.insertCell().textContent = log.date; // Already in DD/MM/YYYY format
        row.insertCell().textContent = log.type.toUpperCase();
        row.insertCell().textContent = log.quantity;
        row.insertCell().textContent = log.expirationDate ? formatDateToDDMMYYYY(log.expirationDate) : 'N/A';
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
      const productInventory = allInventory.filter(item => item.productId === productId && item.quantity > 0);
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
      productInventory.forEach(item => {
          const option = document.createElement('option');
          option.value = item.expirationDate;
          option.dataset.availableQuantity = item.quantity;
          option.textContent = `${item.quantity} Ctns (Expires: ${formatDateToDDMMYYYY(item.expirationDate)})`;
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
      const productHistoryContainer = document.getElementById('productSpecificHistoryContainer');
      const params = new URLSearchParams(window.location.search);
      const currentProductId = params.get('id');
  
      if (toggleBtn && productHistoryContainer && currentProductId && !toggleBtn.dataset.listenerAttachedH) {
          toggleBtn.addEventListener('click', () => { // No longer async
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
      if (toggleStockInBtn && stockInFormEl && !toggleStockInBtn.dataset.listenerAttachedSI) {
          toggleStockInBtn.addEventListener('click', () => {
              const isHidden = stockInFormEl.style.display === 'none' || stockInFormEl.style.display === '';
              if (isHidden) {
                  stockInFormEl.style.display = 'block';
                  toggleStockInBtn.textContent = 'Hide Stock In Form | 关闭进货表';
                  const stockInDateInput = document.getElementById('stockInDate');
                  if (stockInDateInput && !stockInDateInput.value) {
                      stockInDateInput.value = new Date().toISOString().split('T')[0];
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
      if (toggleStockOutBtn && stockOutFormEl && !toggleStockOutBtn.dataset.listenerAttachedSO) {
          toggleStockOutBtn.addEventListener('click', () => {
              const isHidden = stockOutFormEl.style.display === 'none' || stockOutFormEl.style.display === '';
              if (isHidden) {
                  stockOutFormEl.style.display = 'block';
                  toggleStockOutBtn.textContent = 'Hide Stock Out Form | 关闭出货表';
                  const stockOutDateInput = document.getElementById('stockOutDate');
                  if (stockOutDateInput && !stockOutDateInput.value) {
                      stockOutDateInput.value = new Date().toISOString().split('T')[0];
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
      if (successModal && successModalOkButton && !successModalOkButton.dataset.listenerAttachedM) {
          successModalOkButton.addEventListener('click', () => {
              successModal.style.display = 'none';
          });
          successModalOkButton.dataset.listenerAttachedM = 'true';
      }
  
      const exportButton = document.getElementById('exportToSheetBtn');
      if (exportButton && !exportButton.dataset.listenerAttachedE) { 
          exportButton.addEventListener('click', async () => { // Kept async due to fetch
              const pageParams = new URLSearchParams(window.location.search);
              const productId = pageParams.get('id');
              const productNameEl = document.getElementById('productName');
              const productName = productNameEl ? productNameEl.textContent : 'Unknown Product';
  
              if (productId) {
                  await exportTransactionsToGoogleSheet(productId, productName);
              } else {
                  showUIMessage('Cannot export: Product ID not found.', 'error');
              }
          });
          exportButton.dataset.listenerAttachedE = 'true';
      }
      
      const importButton = document.getElementById('importFromSheetBtn');
      if (importButton && !importButton.dataset.listenerAttachedI) { // Unique key for import
          importButton.addEventListener('click', async () => { // Kept async due to fetch
              const pageParams = new URLSearchParams(window.location.search);
              const productId = pageParams.get('id');
              const productNameEl = document.getElementById('productName');
              const productName = productNameEl ? productNameEl.textContent : 'Unknown Product';
  
              if (productId) {
                  await importTransactionsFromGoogleSheet(productId, productName);
              } else {
                  showUIMessage('Cannot import: Product ID not found.', 'error');
              }
          });
          importButton.dataset.listenerAttachedI = 'true';
      }
  }
  
  document.addEventListener('DOMContentLoaded', () => { // No longer async
      // Removed IndexedDB initialization
      // console.log("DB initialization removed from DOMContentLoaded for LS mode.");
  
      const productListContainer = document.getElementById('productListContainer');
      const stockDetailsContainer = document.getElementById('stockDetailsContainer');
  
      if (productListContainer) {
          displayProductsOnIndexPage(); // Synchronous call
      } else if (stockDetailsContainer) {
          displayProductDetails(); // Synchronous call
          initProductPageEventListeners(); 
      }
  });
  
  getProducts(); // Restore global call for LS population if needed
  
