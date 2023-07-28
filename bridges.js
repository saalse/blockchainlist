// Function to fetch data from Airtable
import { fetchAllFromAirtable } from './airtable.js';

// Store the bridges data
let bridgesData = [];

// Store the bridge map
let bridgeMap = new Map();

// Fetch and store bridges data
const fetchBridges = async () => {
  bridgesData = await fetchAllFromAirtable('Bridges');

  // Build the map
  bridgesData.forEach((bridge) => {
    const chains = bridge.fields.Chains_ID;
    if (chains) {
      chains.forEach((chain1) => {
        chains.forEach((chain2) => {
          if (chain1 !== chain2) {
            const key = [chain1, chain2].sort().join('-');
            if (!bridgeMap.has(key)) {
              bridgeMap.set(key, []);
            }
            bridgeMap.get(key).push(bridge);
          }
        });
      });
    }
  });
};

// Fetch bridges data initially and then fetch and render the blockchains
const initializeData = async () => {
  await fetchBridges();
  fetchAndRenderBlockchains();
};

initializeData();

// Function to fetch data from Airtable and render blockchains in the select elements
const fetchAndRenderBlockchains = async () => {
  const loadingMessage = document.getElementById('loadingMessage');

  // Show loading message
  loadingMessage.style.display = 'block';

  const blockchains = await fetchAllFromAirtable('Blockchains');

  // Sort blockchains by name
  blockchains.sort((a, b) =>
    a.fields.Name.toLowerCase() > b.fields.Name.toLowerCase() ? 1 : -1
  );

  const sourceChainSelect = document.getElementById('source-chain-select');
  const targetChainSelect = document.getElementById('target-chain-select');

  blockchains.forEach((blockchain) => {
    const option = document.createElement('option');
    // Use custom blockchain ID as value
    option.value = blockchain.fields.ID;
    option.text = blockchain.fields.Name;
    sourceChainSelect.add(new Option(option.text, option.value));
    targetChainSelect.add(new Option(option.text, option.value));
  });

  // Enable Select2 for these elements
  $(sourceChainSelect).select2();
  $(targetChainSelect).select2();

  // Get the selected chains from the URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const sourceChainName = urlParams.get('sourceChain');
  const targetChainName = urlParams.get('targetChain');

  // Select the chains in the dropdowns
  if (sourceChainName) {
    const sourceChainOption = blockchains.find(
      (blockchain) => blockchain.fields.Name === sourceChainName
    );
    if (sourceChainOption) {
      $(sourceChainSelect).val(sourceChainOption.fields.ID).trigger('change');
    }
  }
  if (targetChainName) {
    const targetChainOption = blockchains.find(
      (blockchain) => blockchain.fields.Name === targetChainName
    );
    if (targetChainOption) {
      $(targetChainSelect).val(targetChainOption.fields.ID).trigger('change');
    }
  }

  // Hide loading message
  loadingMessage.style.display = 'none';

  // Render the bridges after fetching blockchains
  const sourceChainId = $(sourceChainSelect).select2('data')[0]?.id;
  const targetChainId = $(targetChainSelect).select2('data')[0]?.id;
  if (sourceChainId && targetChainId) {
    renderBridges(sourceChainId, targetChainId);
  } else {
    renderBridges();
  }
};

// Function to render bridges
const renderBridges = async (sourceChain = '', targetChain = '') => {
  const bridgesContainer = document.getElementById('bridge-list');
  const bridgeHeader = document
    .getElementById('bridges-container')
    .querySelector('h3');
  const notePara = document
    .getElementById('bridges-container')
    .querySelector('p');
  const totalBridgesPara = document.getElementById('total-bridges');
  const updatedDatePara = document.getElementById('updated-date');

  // Clear previous data
  bridgesContainer.innerHTML = '';

  // Filter the bridges
  let filteredBridges = bridgesData;
  if (sourceChain && targetChain) {
    const key = [sourceChain, targetChain].sort().join('-');
    filteredBridges = bridgeMap.get(key) || [];

    bridgeHeader.textContent = 'Matching bridges';
    notePara.textContent =
      'Note: The listed bridges support the selected blockchains. However, the direction of bridging between these chains may not be supported by all bridges.';
  } else {
    bridgeHeader.textContent = 'Complete list of blockchain bridges';
    notePara.textContent = '';
  }

  // Remove duplicates from the filteredBridges array
  const uniqueFilteredBridges = Array.from(
    new Set(filteredBridges.map((b) => b.fields.Name))
  ).map((name) => {
    return filteredBridges.find((b) => b.fields.Name === name);
  });
  filteredBridges = uniqueFilteredBridges;

  totalBridgesPara.textContent = `Total bridges: ${filteredBridges.length}`;

  const dateStrings = filteredBridges.map((bridge) => bridge.fields.EditDate);
  const dates = dateStrings.map((dateStr) => new Date(dateStr));
  const latestDate = new Date(Math.max(...dates));
  updatedDatePara.textContent = `Last updated: ${latestDate.toLocaleDateString()}`;

  // Get page number from URL
  const urlParams = new URLSearchParams(window.location.search);
  let page = parseInt(urlParams.get('page')) || 1;

  // Implement pagination
  const pageSize = 10;
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  const pagedBridges = filteredBridges.slice(start, end);

  pagedBridges.forEach((bridge) => {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = bridge.fields.URL.startsWith('http')
      ? bridge.fields.URL
      : 'https://' + bridge.fields.URL;
    a.title = `${bridge.fields.Name} bridge`;
    a.text = bridge.fields.Name;
    a.target = '_blank';
    li.appendChild(a);
    const typeSpan = document.createElement('span');
    typeSpan.textContent = ` (${bridge.fields.Type})`;
    li.appendChild(typeSpan);
    bridgesContainer.appendChild(li);
  });

  // Render pagination
  const paginationContainer = document.getElementById('pagination');
  paginationContainer.innerHTML = '';
  const totalPages = Math.ceil(filteredBridges.length / pageSize);

  // Add "Previous page" button
  if (page > 1) {
    const prevButton = document.createElement('button');
    prevButton.textContent = 'Previous';
    prevButton.onclick = () => {
      urlParams.set('page', (page - 1).toString());
      window.history.replaceState(null, '', '?' + urlParams.toString());
      renderBridges(sourceChain, targetChain);
    };
    paginationContainer.appendChild(prevButton);
  }

  // Add "Next page" button
  if (page < totalPages) {
    const nextButton = document.createElement('button');
    nextButton.textContent = 'Next';
    nextButton.onclick = () => {
      urlParams.set('page', (page + 1).toString());
      window.history.replaceState(null, '', '?' + urlParams.toString());
      renderBridges(sourceChain, targetChain);
    };
    paginationContainer.appendChild(nextButton);
  }

  // Show the bridges container
  document.getElementById('bridges-container').classList.remove('d-none');
};

// Fetch and render the blockchains initially
fetchAndRenderBlockchains();

// Add event listener for the select elements

$('#source-chain-select').on('select2:select', function (e) {
  const sourceChain = e.params.data.id;
  const sourceChainName = e.params.data.text;
  const targetChain = $('#target-chain-select').select2('data')[0].id;
  const targetChainName = $('#target-chain-select').select2('data')[0].text;

  const urlParams = new URLSearchParams(window.location.search);
  urlParams.set('sourceChain', sourceChainName);
  urlParams.set('targetChain', targetChainName);
  urlParams.set('page', '1');
  window.history.replaceState(null, '', '?' + urlParams.toString());

  if (sourceChain && targetChain) {
    renderBridges(sourceChain, targetChain);
  }
});

$('#target-chain-select').on('select2:select', function (e) {
  const targetChain = e.params.data.id;
  const targetChainName = e.params.data.text;
  const sourceChain = $('#source-chain-select').select2('data')[0].id;
  const sourceChainName = $('#source-chain-select').select2('data')[0].text;

  const urlParams = new URLSearchParams(window.location.search);
  urlParams.set('sourceChain', sourceChainName);
  urlParams.set('targetChain', targetChainName);
  urlParams.set('page', '1');
  window.history.replaceState(null, '', '?' + urlParams.toString());

  if (sourceChain && targetChain) {
    renderBridges(sourceChain, targetChain);
  }
});
