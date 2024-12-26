// Check if we're on the desired page
if (window.location.href.includes("cielo.finance/profile/")) {
  
  // Create a floating label element
  const floatingLabel = createFloatingLabel();
  document.body.appendChild(floatingLabel);

  const localStorageKey = "uniqueElements";
  let uniqueElements = [];
  localStorage.setItem(localStorageKey, JSON.stringify(uniqueElements));
  
  function createFloatingLabel() {
    const label = document.createElement('div');
    Object.assign(label.style, {
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      width: '400px',
      height: '800px',
      backgroundColor: '#f0f0f0',
      color: '#333',
      padding: '10px',
      boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.1)',
      borderRadius: '8px',
      fontFamily: 'Arial, sans-serif',
      fontSize: '12px',
      zIndex: 1000,
      overflowY: 'scroll',
      wordWrap: 'break-word',
      overflowWrap: 'break-word',
    });
    return label;
  }

  function parseTradeDetails(element) {
    const typeRaw = element.querySelector("div > div .text-textSecondary");
    const time = element.querySelector("div > div:nth-child(3) p")?.textContent;
    const mainContent = element.querySelector("div > div:nth-child(2) .text-textBase > span");

    let token, amount, SOLprice, type;
    if (typeRaw) {
      if (typeRaw.textContent.includes("Swap Buy")) {
        token = mainContent.querySelector("div:nth-child(5)").textContent;
        amount = mainContent.querySelector("div:nth-child(4)").textContent;
        SOLprice = mainContent.querySelector("div:nth-child(1)").textContent;
        type = "Bought";
      } else if (typeRaw.textContent.includes("Swap Sell")) {
        token = mainContent.querySelector("div:nth-child(2)").textContent;
        amount = mainContent.querySelector("div:nth-child(1)").textContent;
        SOLprice = mainContent.querySelector("div:nth-child(4)").textContent;
        type = "Sold";
      }
    }

    if (type && token && amount && SOLprice) {
      if (type === "undefined" || token === "undefined" || amount === "undefined" || SOLprice === "undefined") { return null; }
      const tradeDetails = `${type} ${amount} of ${token} for ${SOLprice} SOL`;
      console.log(tradeDetails);
      return tradeDetails;
    }
    return null;
  }

  function updateFloatingLabel() {
    const targetElements = document.querySelectorAll("[data-testid=virtuoso-item-list] > div > div > .col .mb-6");

    targetElements.forEach(element => {
      const tradeDetails = parseTradeDetails(element);
      if (tradeDetails && !uniqueElements.includes(tradeDetails)) {
        uniqueElements.push(tradeDetails);
        console.log('Added new trade:', tradeDetails);
      }
    });

    localStorage.setItem(localStorageKey, JSON.stringify(uniqueElements));
    updateListInFloatingLabel();
  }

  function updateListInFloatingLabel() {
    const list = document.createElement('ul');
    uniqueElements.forEach(trade => {
      const listItem = document.createElement('li');
      listItem.textContent = trade;
      list.appendChild(listItem);
    });

    floatingLabel.innerHTML = ''; // Clear the existing list before appending the new one
    floatingLabel.appendChild(list);
  }

  // Update the floating label after a short delay
  setInterval(updateFloatingLabel, 1000);
}
