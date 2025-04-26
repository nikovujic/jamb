document.addEventListener('DOMContentLoaded', () => {
  const columns = ["", "Down", "Up", "Free", "Announcement", "Row Sum"];
  const categories = [
    "1", "2", "3", "4", "5", "6",
    "Sum 1-6 + Bonus",
    "Max", "Min",
    "Max - Min result",
    "2 pairs", "Straight", "Full", "Poker", "Yamb",
    "Subtotal", "Total (Ukupno)"
  ];

  const grid = document.getElementById('yambGrid');

  // Create header
  columns.forEach(columnName => {
    const div = document.createElement('div');
    div.className = 'grid-item header';
    div.textContent = columnName;
    grid.appendChild(div);
  });

  // Create rows
  categories.forEach(categoryName => {
    const categoryDiv = document.createElement('div');
    categoryDiv.className = 'grid-item category';
    categoryDiv.textContent = categoryName;
    grid.appendChild(categoryDiv);

    for (let i = 0; i < 5; i++) {
      const inputDiv = document.createElement('div');
      inputDiv.className = 'grid-item';

      let input;

      // Special handling for TOTAL row
      if (categoryName === "Total (Ukupno)") {
        if (i === 0) {
          // First cell = static text "Total:"
          inputDiv.classList.add('total-text');
          inputDiv.textContent = "Total:";
          grid.appendChild(inputDiv);
          continue;
        }
        if (i === 1) {
          // Second cell = input for total value
          input = document.createElement('input');
          input.type = 'number';
          input.placeholder = "-";
          input.readOnly = true;
          input.dataset.category = categoryName;
          input.dataset.index = i;

          inputDiv.appendChild(input);
          grid.appendChild(inputDiv);
          break; // After the second cell, stop
        }
      } else {
        // Normal fields
        if (categoryName === "Straight" && i < 4) {
          input = document.createElement('select');

          const optionDefault = document.createElement('option');
          optionDefault.value = "";
          optionDefault.textContent = "-";
          input.appendChild(optionDefault);

          const optionSmall = document.createElement('option');
          optionSmall.value = "35";
          optionSmall.textContent = "Small Straight (35)";
          input.appendChild(optionSmall);

          const optionLarge = document.createElement('option');
          optionLarge.value = "45";
          optionLarge.textContent = "Large Straight (45)";
          input.appendChild(optionLarge);

          input.addEventListener('change', () => {
            calculateTotals();
          });
        } else {
          input = document.createElement('input');
          input.type = 'number';
          input.placeholder = "-";

          if (["1", "2", "3", "4", "5", "6"].includes(categoryName)) {
            const max = parseInt(categoryName) * 5;
            input.min = 0;
            input.max = max;
          }

          if (["Subtotal", "Sum 1-6 + Bonus", "Max - Min result"].includes(categoryName) || i === 4) {
            input.readOnly = true;
            inputDiv.classList.add('calculated');
          } else {
            input.addEventListener('input', () => {
              limitInput(input);
            });
            input.addEventListener('blur', () => {
              calculateTotals();
            });
          }
        }

        input.dataset.category = categoryName;
        input.dataset.column = columns[i + 1] || "Row Sum";
        input.dataset.index = i;

        inputDiv.appendChild(input);

        // Bonus hint for special fields
        if (["2 pairs", "Full", "Poker", "Yamb"].includes(categoryName) && i < 4) {
          const bonusHint = document.createElement('span');
          bonusHint.className = 'bonus-hint';
          bonusHint.style.fontSize = '0.7em';
          bonusHint.style.color = '#4CAF50';
          bonusHint.style.display = 'block';
          bonusHint.style.marginTop = '2px';
          inputDiv.appendChild(bonusHint);
        }

        grid.appendChild(inputDiv);
      }
    }
  });

  function limitInput(input) {
    const value = parseInt(input.value);
    if (input.max && value > parseInt(input.max)) {
      input.value = input.max;
    }
    if (input.min && value < parseInt(input.min)) {
      input.value = input.min;
    }
  }

  function calculateTotals() {
    const columnData = [[], [], [], []];
    const allInputs = document.querySelectorAll('#yambGrid input, #yambGrid select');

    allInputs.forEach(input => {
      if (["Subtotal", "Sum 1-6 + Bonus", "Max - Min result"].includes(input.dataset.category) || input.dataset.index == 4) {
        input.value = '';
      }
      const bonusHint = input.parentElement.querySelector('.bonus-hint');
      if (bonusHint) bonusHint.textContent = '';
    });

    allInputs.forEach(input => {
      const category = input.dataset.category;
      const index = input.dataset.index;
      let value = (input.tagName === "SELECT") ? parseInt(input.value) : parseInt(input.value);

      const bonusHint = input.parentElement.querySelector('.bonus-hint');

      if (["1", "2", "3", "4", "5", "6"].includes(category)) {
        const base = parseInt(category);
        if (!isNaN(value) && value % base !== 0) {
          input.value = '';
          value = 0;
        }
      }

      if (category === "2 pairs") {
        if (value) {
          if (bonusHint) bonusHint.textContent = `${value} +10 = ${value + 10}`;
          value += 10;
        }
      }
      if (category === "Full") {
        if (value) {
          if (bonusHint) bonusHint.textContent = `${value} +30 = ${value + 30}`;
          value += 30;
        }
      }
      if (category === "Poker") {
        if (value) {
          if (bonusHint) bonusHint.textContent = `${value} +40 = ${value + 40}`;
          value += 40;
        }
      }
      if (category === "Yamb") {
        if (value) {
          if (bonusHint) bonusHint.textContent = `${value} +50 = ${value + 50}`;
          value += 50;
        }
      }

      if (index !== undefined && index < 4 && !["Subtotal", "Sum 1-6 + Bonus", "Max - Min result"].includes(category)) {
        columnData[index].push({ category, value: value || 0 });
      }
    });

    // Per-column calculations
    columnData.forEach((items, colIndex) => {
      let sum1to6 = 0;
      let max = null;
      let min = null;
      let ones = 0;
      let twoPairsToYambSum = 0;

      items.forEach(({category, value}) => {
        if (["1", "2", "3", "4", "5", "6"].includes(category)) {
          sum1to6 += value;
          if (category === "1") ones = value / 1;
        }
        if (category === "Max") max = value;
        if (category === "Min") min = value;
        if (["2 pairs", "Straight", "Full", "Poker", "Yamb"].includes(category)) {
          twoPairsToYambSum += value;
        }
      });

      const sumWithBonus = sum1to6 >= 60 ? sum1to6 + 30 : sum1to6;
      setInputValue("Sum 1-6 + Bonus", colIndex, sumWithBonus);

      if (max !== null && min !== null) {
        const maxMinResult = (max - min) * ones;
        setInputValue("Max - Min result", colIndex, maxMinResult);
      }

      setInputValue("Subtotal", colIndex, twoPairsToYambSum);
    });

    const rowSums = {
      "Sum 1-6 + Bonus": 0,
      "Max - Min result": 0,
      "Subtotal": 0
    };

    allInputs.forEach(input => {
      const category = input.dataset.category;
      const index = parseInt(input.dataset.index);
      const value = parseInt(input.value) || 0;

      if (index >= 0 && index <= 3) {
        if (rowSums[category] !== undefined) {
          rowSums[category] += value;
        }
      }
    });

    allInputs.forEach(input => {
      const category = input.dataset.category;
      const index = parseInt(input.dataset.index);

      if (index === 4 && rowSums[category] !== undefined) {
        input.value = rowSums[category];
      }
    });

    const grandTotal = (rowSums["Sum 1-6 + Bonus"] || 0) + (rowSums["Max - Min result"] || 0) + (rowSums["Subtotal"] || 0);

    setInputValue("Total (Ukupno)", 1, grandTotal);
  }

  function setInputValue(category, index, value) {
    const input = document.querySelector(`input[data-category="${category}"][data-index="${index}"], select[data-category="${category}"][data-index="${index}"]`);
    if (input) {
      input.value = value;
    }
  }
});

