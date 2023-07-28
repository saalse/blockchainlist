// Function to fetch data from Airtable
import { fetchAllFromAirtable } from './airtable.js';

// Function to render blockchain data
const renderBlockchains = async (sort, page = 1) => {
  // Get blockchains from localStorage
  let blockchains = JSON.parse(localStorage.getItem('blockchains'));

  if (!blockchains) {
    blockchains = await fetchAllFromAirtable('Blockchains');
    localStorage.setItem('blockchains', JSON.stringify(blockchains));
  }

  // Get all unique Ecosystem values
  const ecosystems = [...new Set(blockchains.map((b) => b.fields.Ecosystem))];
  const filterSelect = document.getElementById('filter-select');

  // Clear existing options
  filterSelect.innerHTML = '';

  // Add an "All" option
  const allOption = document.createElement('option');
  allOption.value = 'All';
  allOption.text = 'All';
  filterSelect.appendChild(allOption);

  // Add an option for each Ecosystem
  ecosystems.forEach((eco) => {
    const option = document.createElement('option');
    option.value = eco ? eco : 'Undefined';
    option.text = eco ? eco : 'Undefined';
    filterSelect.appendChild(option);
  });

  // Get filter and page values from URL
  const urlParams = new URLSearchParams(window.location.search);
  const filterValue = urlParams.get('ecosystem') || 'All';
  const currentPage = urlParams.get('page') || page;

  // Set initial filter value to previous selection
  filterSelect.value = filterValue;

  // Add event listener for filter
  filterSelect.addEventListener('change', (e) => {
    let filteredBlockchains = blockchains;

    if (e.target.value !== 'All') {
      filteredBlockchains = blockchains.filter(
        (b) =>
          (b.fields.Ecosystem ? b.fields.Ecosystem : 'Undefined') ===
          e.target.value
      );
    }

    // Update the URL with the selected filter value
    urlParams.set('ecosystem', e.target.value);
    urlParams.set('page', '1');
    window.history.pushState(null, '', '?' + urlParams.toString());

    renderBlockchains(sort, 1);
  });

  if (filterValue !== 'All') {
    blockchains = blockchains.filter(
      (b) =>
        (b.fields.Ecosystem ? b.fields.Ecosystem : 'Undefined') === filterValue
    );
  }

  // Sort by name
  blockchains.sort((a, b) => a.fields.Name.localeCompare(b.fields.Name));

  // Implement pagination
  const pageSize = 10;
  const start = (currentPage - 1) * pageSize;
  const end = start + pageSize;
  const pagedBlockchains = blockchains.slice(start, end);

  const container = document.getElementById('blockchain-list');
  container.innerHTML = '';

  pagedBlockchains.forEach((blockchain) => {
    const div = document.createElement('div');
    div.classList.add('p-3', 'border', 'rounded', 'mb-2');
    const name = blockchain.fields.Name;
    const ecosystem = blockchain.fields.Ecosystem; // Get Ecosystem value
    div.textContent = ecosystem ? `${name} (${ecosystem})` : name; // Use Ecosystem value if it exists
    container.appendChild(div);
  });

  // Render pagination
  const paginationContainer = document.getElementById('pagination');
  paginationContainer.innerHTML = '';
  const totalPages = Math.ceil(blockchains.length / pageSize);

  // Add "First page" button
  if (currentPage > 1) {
    const firstButton = document.createElement('button');
    firstButton.textContent = 'First';
    firstButton.onclick = () => {
      urlParams.set('page', '1');
      window.history.pushState(null, '', '?' + urlParams.toString());
      renderBlockchains(sort, 1);
    };
    paginationContainer.appendChild(firstButton);
  }

  // Add "Previous page" button
  if (currentPage > 1) {
    const prevButton = document.createElement('button');
    prevButton.textContent = 'Previous';
    prevButton.onclick = () => {
      urlParams.set('page', (currentPage - 1).toString());
      window.history.pushState(null, '', '?' + urlParams.toString());
      renderBlockchains(sort, currentPage - 1);
    };
    paginationContainer.appendChild(prevButton);
  }

  // Add "Next page" button
  if (currentPage < totalPages) {
    const nextButton = document.createElement('button');
    nextButton.textContent = 'Next';
    nextButton.onclick = () => {
      urlParams.set('page', (parseInt(currentPage) + 1).toString());
      window.history.pushState(null, '', '?' + urlParams.toString());
      renderBlockchains(sort, parseInt(currentPage) + 1);
    };
    paginationContainer.appendChild(nextButton);
  }

  // Display total number of chains
  const totalDiv = document.getElementById('total-chains');
  totalDiv.textContent = `Total chains: ${blockchains.length}`;

  // Display last updated date
  const lastUpdated = blockchains.length
    ? blockchains.reduce((latest, chain) => {
        return new Date(chain.createdTime) > new Date(latest)
          ? chain.createdTime
          : latest;
      }, blockchains[0].createdTime)
    : null;
  const updatedDiv = document.getElementById('updated-date');
  updatedDiv.textContent = `Updated: ${
    lastUpdated
      ? new Date(lastUpdated).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      : 'N/A'
  }`;
};

// Call the render function initially without any sorting
const params = new URLSearchParams(window.location.search);
const initialPage = parseInt(params.get('page')) || 1;
renderBlockchains('Name', initialPage);
