// --- Wait for DOM to load ---
document.addEventListener('DOMContentLoaded', () => {
  const columns = ["", "Down", "Up", "Free", "Announcement", "Row Sum"];
  const categories = [
    "1", "2", "3", "4", "5", "6",
    "Sum 1-6 + Bonus",
    "Max", "Min",
    "Max - Min result",
    "2 pairs", "Straight", "Full", "Poker", "Yamb",
    "Subtotal"
    // Total will be created manually after
  ];

  const grid = document.getElementById('yambGrid');

  // --- Create Header ---
  columns.forEach(columnName => {
    const div = document.createElement('div');
    div.className = 'grid-item header';
    if (columnName === "Row Sum") {
      div.classList.add('empty');
    } else {
      div.textContent = columnName;
    }
    grid.appendChild(div);
  });

  // --- Create normal rows ---
  categories.forEach(categoryName => {
    const categoryDiv = document.createElement('div');
    categoryDiv.className = 'grid-item category';
    categoryDiv.textContent = categoryName;
    grid.appendChild(categoryDiv);

    for (let i = 0; i < 5; i++) {
      if (i === 4 && !["Sum 1-6 + Bonus", "Max - Min result", "Subtotal"].includes(categoryName)) {
        const emptyDiv = document.createElement('div');
        emptyDiv.className = 'grid-item empty';
        grid.appendChild(emptyDiv);
        continue;
      }

      const inputDiv = document.createElement('div');
      inputDiv.className = 'grid-item';

      let input;
      if (categoryName === "Straight" && i < 4) {
        input = document.createElement('select');
        const options = ["-", "Small (35)", "Large (45)"];
        options.forEach(opt => {
          const option = document.createElement('option');
          option.value = opt.includes("(") ? opt.match(/\((\d+)\)/)[1] : "";
          option.textContent = opt;
          input.appendChild(option);
        });
        input.addEventListener('change', calculateTotals);
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
          input.addEventListener('input', () => limitInput(input));
          input.addEventListener('blur', calculateTotals);
        }
      }

      input.dataset.category = categoryName;
      input.dataset.index = i;
      inputDiv.appendChild(input);

      if (["2 pairs", "Full", "Poker", "Yamb"].includes(categoryName) && i < 4) {
        const bonusHint = document.createElement('span');
        bonusHint.className = 'bonus-hint';
        inputDiv.appendChild(bonusHint);
      }

      grid.appendChild(inputDiv);
    }
  });

  // --- Create the Total row manually ---
  for (let i = 0; i < 4; i++) {
    const emptyDiv = document.createElement('div');
    emptyDiv.className = 'grid-item empty';
    grid.appendChild(emptyDiv);
  }

  const totalLabelDiv = document.createElement('div');
  totalLabelDiv.className = 'grid-item total-label';
  totalLabelDiv.textContent = 'Total';
  grid.appendChild(totalLabelDiv);

  const totalInputDiv = document.createElement('div');
  totalInputDiv.className = 'grid-item';

  const totalInput = document.createElement('input');
  totalInput.type = 'number';
  totalInput.placeholder = "-";
  totalInput.readOnly = true;
  totalInput.dataset.category = "Total";
  totalInput.dataset.index = 4;

  totalInputDiv.appendChild(totalInput);
  grid.appendChild(totalInputDiv);

  // --- Functions ---

  function limitInput(input) {
    const value = parseInt(input.value);
    if (input.max && value > parseInt(input.max)) input.value = input.max;
    if (input.min && value < parseInt(input.min)) input.value = input.min;
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

      if (category === "2 pairs" && value) {
        if (bonusHint) bonusHint.textContent = `${value} +10 = ${value + 10}`;
        value += 10;
      }
      if (category === "Full" && value) {
        if (bonusHint) bonusHint.textContent = `${value} +30 = ${value + 30}`;
        value += 30;
      }
      if (category === "Poker" && value) {
        if (bonusHint) bonusHint.textContent = `${value} +40 = ${value + 40}`;
        value += 40;
      }
      if (category === "Yamb" && value) {
        if (bonusHint) bonusHint.textContent = `${value} +50 = ${value + 50}`;
        value += 50;
      }

      if (index !== undefined && index < 4 && !["Subtotal", "Sum 1-6 + Bonus", "Max - Min result"].includes(category)) {
        columnData[index].push({ category, value: value || 0 });
      }
    });

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

    const sumFields = document.querySelectorAll('input[data-category="Sum 1-6 + Bonus"], input[data-category="Max - Min result"], input[data-category="Subtotal"]');
    let grandTotal = 0;
    sumFields.forEach(input => {
      const value = parseInt(input.value) || 0;
      grandTotal += value;
    });

    setInputValue("Total", 4, grandTotal);
  }

  function setInputValue(category, index, value) {
    const input = document.querySelector(`input[data-category="${category}"][data-index="${index}"]`);
    if (input) input.value = value;
  }
});

