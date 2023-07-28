// Set the URL of the Cloud Function
const cloudFunctionURL =
  'https://us-central1-chain-atlas-383914.cloudfunctions.net/airtable-api-proxy';

// Function to fetch all data from Airtable
const fetchAllFromAirtable = async (table) => {
  const currentTime = new Date().getTime();
  const oneHour = 10; // 24 hours in milliseconds
  const cachedData = localStorage.getItem(table);

  if (cachedData) {
    const { data, timestamp } = JSON.parse(cachedData);

    // Use cached data if it's not older than 1 hour
    if (currentTime - timestamp < oneHour) {
      return data;
    }
  }

  const records = [];
  let offset = null;

  do {
    let url = `${cloudFunctionURL}?table=${table}&pageSize=100`; // fetch 100 records at a time

    // Add offset parameter if provided
    if (offset) {
      url += `&offset=${offset}`;
    }

    const response = await fetch(url);
    const data = await response.json();

    // records.push(...data.records);
    records.push(...data); // Adjusted this line to push data directly

    offset = data.offset; // update the offset for the next batch
  } while (offset);

  // Store the fetched data in localStorage with the current timestamp
  localStorage.setItem(
    table,
    JSON.stringify({ data: records, timestamp: currentTime })
  );

  return records;
};

export { fetchAllFromAirtable };
