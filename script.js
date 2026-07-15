let ingredientCount = 1;
let currentMultiplier = 1;

function showSection(id) {
  document.getElementById('section-calc').classList.add('hidden');
  document.getElementById('section-usage').classList.add('hidden');
  document.getElementById('section-history').classList.add('hidden');
  document.getElementById(`section-${id}`).classList.remove('hidden');
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.getElementById(`btn-${id}`).classList.add('active');
  if(id === 'history') loadHistory();
}

function saveHistory(multiplier, items) {
  let history = JSON.parse(localStorage.getItem('recipe_history') || '[]');
  const entry = { date: new Date().toLocaleString(), multiplier: toFraction(multiplier), items: items };
  history.unshift(entry);
  if(history.length > 20) history.pop();
  localStorage.setItem('recipe_history', JSON.stringify(history));
}

function deleteEntry(index) {
  let history = JSON.parse(localStorage.getItem('recipe_history') || '[]');
  history.splice(index, 1);
  localStorage.setItem('recipe_history', JSON.stringify(history));
  loadHistory();
}

function clearAllHistory() {
  if(confirm('全ての履歴を削除しますか？')) {
    localStorage.removeItem('recipe_history');
    loadHistory();
  }
}

function loadHistory() {
  const history = JSON.parse(localStorage.getItem('recipe_history') || '[]');
  const container = document.getElementById('history-list');
  const controls = document.getElementById('history-controls');
  
  container.innerHTML = history.length ? '' : '<p class="text-gray-500">履歴はありません。</p>';
  controls.innerHTML = '';
  
  if(history.length > 0) {
    const btn = document.createElement('button');
    btn.innerText = '全履歴リセット';
    btn.className = 'bg-red-500 text-white text-[10px] px-2 py-1 rounded';
    btn.onclick = clearAllHistory;
    controls.appendChild(btn);
  }

  history.forEach((h, index) => {
    const div = document.createElement('div');
    div.className = 'border-b pb-2 relative';
    let itemsHtml = h.items.map(i => `<li>${i.original} (×${h.multiplier}) → ${i.result}</li>`).join('');
    div.innerHTML = `
      <div class="flex justify-between items-center">
        <p class="font-bold text-gray-700 text-[10px]">${h.date} (倍率: ${h.multiplier}倍)</p>
        <button onclick="deleteEntry(${index})" class="text-[10px] text-red-500 border border-red-500 px-1 rounded">削除</button>
      </div>
      <ul class="list-disc pl-4">${itemsHtml}</ul>
    `;
    container.appendChild(div);
  });
}

function setActiveButton(btn) {
  document.querySelectorAll('.btn, .btn-person').forEach(b => b.classList.remove('active'));
  if(btn) btn.classList.add('active');
}

function setMultiplier(val, btn) { currentMultiplier = val; updateMultiplierDisplay(); setActiveButton(btn); }
function applyFraction(btn) { const val = parseFloat(document.getElementById('input-fraction').value); if(!isNaN(val) && val > 0) { currentMultiplier = 1 / val; updateMultiplierDisplay(); setActiveButton(btn); } }
function applyMultiplier(btn) { const val = parseFloat(document.getElementById('input-multiplier').value); if(!isNaN(val) && val >= 1) { currentMultiplier = val; updateMultiplierDisplay(); setActiveButton(btn); } }
function updateMultiplierDisplay() { document.getElementById('current-multiplier-display').innerText = toFraction(currentMultiplier); }

function addIngredientRow() {
  ingredientCount++;
  const container = document.getElementById('ingredients-container');
  const newRow = document.createElement('div');
  newRow.className = 'tb-set';
  newRow.id = `tb_set_${ingredientCount}`;
  newRow.innerHTML = `
    <span class="text-gray-500 w-10 text-xs">${ingredientCount}つ目</span>
    <input type="text" id="tb1_${ingredientCount}" class="custom-input input-text-size w-[110px]" placeholder="材料名">
    <input type="text" id="tb2_${ingredientCount}" class="custom-input input-text-size w-[100px]" placeholder="大/小 or 数値">
    <input type="text" id="tb3_${ingredientCount}" class="custom-input input-text-size w-[100px]" placeholder="数値 or mL">
    <button type="button" class="btn btn-remove" onclick="removeRow(${ingredientCount})">削除</button>
  `;
  container.appendChild(newRow);
}

function removeRow(id) { const row = document.getElementById(`tb_set_${id}`); if(row) row.remove(); }

function parseFraction(str) {
  if (!str) return NaN;
  str = str.trim().replace(/と/g, ' ').replace(/／/g, '/');
  const parts = str.split(/\s+/);
  let total = 0;
  for (let part of parts) {
    if (part.includes('/')) {
      const sub = part.split('/');
      if (sub.length === 2) total += parseFloat(sub[0]) / parseFloat(sub[1]);
    } else {
      total += parseFloat(part);
    }
  }
  return total;
}

function toFraction(num) {
  const tolerance = 0.05;
  const fractions = [{n: 1/2, s: "1/2"}, {n: 1/3, s: "1/3"}, {n: 2/3, s: "2/3"}, {n: 1/4, s: "1/4"}, {n: 3/4, s: "3/4"}, {n: 1/6, s: "1/6"}, {n: 5/6, s: "5/6"}, {n: 1/8, s: "1/8"}, {n: 3/8, s: "3/8"}, {n: 5/8, s: "5/8"}, {n: 7/8, s: "7/8"}];
  const integer = Math.floor(num);
  const frac = num - integer;
  if (frac < tolerance) return `${integer > 0 ? integer : (num === 0 ? "0" : "")}`;
  if (frac > 1 - tolerance) return `${integer + 1}`;
  for (let f of fractions) {
    if (Math.abs(frac - f.n) < tolerance) return (integer > 0 ? integer + "と" : "") + f.s;
  }
  return Math.round(num * 100) / 100;
}

function calculate() {
  const resultList = document.getElementById('result-list'); 
  resultList.innerHTML = '';
  let historyItems = [];
  
  for (let i = 1; i <= 100; i++) {
    const row = document.getElementById(`tb_set_${i}`); 
    if (!row) continue;
    const name = document.getElementById(`tb1_${i}`).value.trim();
    const v1 = document.getElementById(`tb2_${i}`).value.trim();
    const v2 = document.getElementById(`tb3_${i}`).value.trim();
    if(!v1 && !v2) continue;
    
    const p1 = parseFraction(v1);
    const p2 = parseFraction(v2);
    let num = !isNaN(p1) ? p1 : p2;
    let unit = isNaN(p1) ? v1 : v2;
    
    const totalNum = num * currentMultiplier;
    const isOosaji = unit === '大さじ' || unit === '大';
    const isKosaji = unit === '小さじ' || unit === '小';
    
    const namePart = name ? name + " : " : "";

    let display = '';
    if (isKosaji) {
        let da = totalNum / 3;
        display = `${namePart}小さじ${toFraction(totalNum)}(大さじ${toFraction(da)})`;
    } else if (isOosaji) {
        let ko = totalNum * 3;
        display = `${namePart}大さじ${toFraction(totalNum)}(小さじ${toFraction(ko)})`;
    } else {
        display = `${namePart}${toFraction(totalNum)}${unit}`;
    }
    
    const li = document.createElement('li');
    li.innerText = display;
    resultList.appendChild(li);
    historyItems.push({ original: `${name}(${v1}${v2})`, result: display });
  }
  
  document.getElementById('result-multiplier-display').innerText = toFraction(currentMultiplier);
  document.getElementById('result-area').classList.remove('hidden');
  saveHistory(currentMultiplier, historyItems);
}