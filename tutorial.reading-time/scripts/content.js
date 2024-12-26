// Check if we're on the desired page
if (window.location.href.includes("cielo.finance/profile/")) {

  const localStorageKey = "uniqueElements";
  const tokenStatsKey = "tokenStats";
  let uniqueElements = [];
  let tokenStats = {};
  let processedTrades = new Set(); // Keep track of processed trades

  // Clear localStorage at page load
  localStorage.removeItem(localStorageKey);
  localStorage.removeItem(tokenStatsKey);

  // Create a floating label element
  const floatingLabel = createFloatingLabel();
  document.body.appendChild(floatingLabel);

  function parseTradeDetails(element) {
    const typeRaw = element.querySelector("div > div .text-textSecondary");
    const time = element.querySelector("div > div:nth-child(3) p")?.textContent;
    const mainContent = element.querySelector("div > div:nth-child(2) .text-textBase > span");

    let token, amount, SOLprice, type;
    if (typeRaw) {
      if (typeRaw.textContent.includes("Swap Buy")) {
        token = mainContent.querySelector("div:nth-child(5)").textContent;
        amount = parseNumberWithSuffix(mainContent.querySelector("div:nth-child(4)").textContent);
        SOLprice = parseFloat(mainContent.querySelector("div:nth-child(1)").textContent);
        type = "Bought";
      } else if (typeRaw.textContent.includes("Swap Sell")) {
        token = mainContent.querySelector("div:nth-child(2)").textContent;
        amount = parseNumberWithSuffix(mainContent.querySelector("div:nth-child(1)").textContent);
        SOLprice = parseFloat(mainContent.querySelector("div:nth-child(4)").textContent);
        type = "Sold";
      }
    }

    if (type && token && amount && SOLprice) {
      if (type === "undefined" || token === "undefined" || isNaN(amount) || isNaN(SOLprice)) { return null; }

      const tradeKey = `${type}-${token}-${amount}-${SOLprice}-${time}`; // Create unique key for trade

      // Only process new trades
      if (!processedTrades.has(tradeKey)) {
        processedTrades.add(tradeKey);

        // Initialize token stats if needed
        if (!tokenStats[token]) {
          tokenStats[token] = {
            solInvested: 0,
            solReceived: 0,
            remainingAmount: 0,
            lastKnownPrice: 0,    // Add this
            lastTradeTime: null   // Add this to track when price was last updated
          };
        }

        // Update token statistics
        if (type === "Bought") {
          tokenStats[token].solInvested += SOLprice;
          tokenStats[token].remainingAmount += amount;
        } else {
          tokenStats[token].solReceived += SOLprice;
          tokenStats[token].remainingAmount -= amount;
        }
        const tokenPrice = calculateTokenPrice(amount, SOLprice);
        // Update last known price only if this trade is more recent
        if (!tokenStats[token].lastTradeTime || new Date(time) > new Date(tokenStats[token].lastTradeTime)) {
          tokenStats[token].lastKnownPrice = tokenPrice;
          tokenStats[token].lastTradeTime = time;
          console.log(111, tokenStats[token]);
        }
      }

      const tradeDetails = `${type} ${amount} of ${token} for ${SOLprice} SOL`;
      return tradeDetails;
    }
    return null;
  }

  function calculatePNL(stats) {
    if (stats.solInvested === 0) return 0;
    return ((stats.solReceived - stats.solInvested) / stats.solInvested * 100).toFixed(2);
  }

  function formatTokenStats() {
    let statsHTML = '<div style="margin-bottom: 20px; padding: 10px; background-color: #fff; border-radius: 4px;">';
    statsHTML += '<h3 style="margin-bottom: 10px;">Token Statistics</h3>';

    for (const [token, stats] of Object.entries(tokenStats)) {
      const pnl = calculatePNL(stats);
      const forecastedPNL = calculateForecastPNL(stats);
      statsHTML += `<div style="margin-bottom: 10px;">
  ${pnl > 0 ? "🟢" : stats.remainingAmount > 0 ? "❓" : "🔴"}<strong>${token}:</strong> 
  ${stats.remainingAmount ? "Current " : ""}PNL: ${pnl}% 
  ${stats.remainingAmount ? `
    💼 Remaining: ${formatLargeNumber(stats.remainingAmount)}
    ⏭️ Forecasted PNL: ${forecastedPNL > 0 ? "🟢":"🔴"} ${forecastedPNL}% @ ${stats.lastKnownPrice.toFixed(6)} SOL/token
  ` : ""}<br>
  SOL invested: ${stats.solInvested.toFixed(3)} SOL received: ${stats.solReceived.toFixed(3)}
</div>`;
    }

    statsHTML += '</div>';
    return statsHTML;
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

    updateListInFloatingLabel();
  }

  function updateListInFloatingLabel() {
    // Add token statistics at the top
    const statsHTML = formatTokenStats();

    // Create trade list
    const list = document.createElement('ul');
    uniqueElements.forEach(trade => {
      const listItem = document.createElement('li');
      listItem.textContent = trade;
      list.appendChild(listItem);
    });

    floatingLabel.innerHTML = statsHTML; // Add stats first
    floatingLabel.appendChild(list); // Then add the trade list
  }

  // Add reset button at the top of the floating label
  const resetButton = document.createElement('button');
  resetButton.textContent = 'Reset Statistics';
  resetButton.style.cssText = `
    position: absolute;
    top: 10px;
    right: 10px;
    padding: 5px 10px;
    background-color: #ff4444;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  `;
  resetButton.onclick = function () {
    tokenStats = {};
    uniqueElements = [];
    processedTrades.clear();
    updateListInFloatingLabel();
  };
  floatingLabel.appendChild(resetButton);

  // Update the floating label after a short delay
  setInterval(updateFloatingLabel, 1000);
}

function createFloatingLabel() {
  const label = document.createElement('div');
  Object.assign(label.style, {
    position: 'fixed',
    bottom: '80px',
    right: '15px',
    width: '400px',
    height: '1090px',
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

function parseNumberWithSuffix(text) {
  const number = text.replace(/,/g, '');
  const match = number.match(/^([\d.]+)([KkMmBb])?$/);
  if (!match) return parseFloat(number);

  const value = parseFloat(match[1]);
  const suffix = match[2]?.toLowerCase();

  switch (suffix) {
    case 'k': return value * 1000;
    case 'm': return value * 1000000;
    case 'b': return value * 1000000000;
    default: return value;
  }
}

function formatLargeNumber(num) {
  const absNum = Math.abs(num);
  if (absNum >= 1000000000) {
    return (num / 1000000000).toFixed(2) + 'B';
  } else if (absNum >= 1000000) {
    return (num / 1000000).toFixed(2) + 'M';
  } else if (absNum >= 1000) {
    return (num / 1000).toFixed(2) + 'K';
  }
  return num.toFixed(2);
}

function calculateTokenPrice(amount, solPrice) {
  return solPrice / amount;
}

function calculateForecastPNL(stats) {
  if (stats.solInvested === 0) return 0;
  const potentialSolFromRemaining = stats.remainingAmount * stats.lastKnownPrice;
  const totalPotentialReturn = stats.solReceived + potentialSolFromRemaining;
  return ((totalPotentialReturn - stats.solInvested) / stats.solInvested * 100).toFixed(2);
}