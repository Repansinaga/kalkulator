const expressionDisplay = document.getElementById('expression-display');
const resultDisplay = document.getElementById('result-display');
const historyList = document.getElementById('history-list');
const historyEmpty = document.getElementById('history-empty');
const clearHistoryButton = document.getElementById('clear-history');

let currentExpression = '';
let currentResult = '';
let history = [];

function isOperator(char) {
    return ['+', '-', 'x', '/', '^'].includes(char);
}

// [PERBAIKAN] Logika formatting angka lebih pintar untuk menghindari 0.3000000004
function formatNumber(value) {
    if (Number.isNaN(value) || !Number.isFinite(value)) return 'Error';
    
    // Gunakan precision 12 digit untuk membuang 'sampah' desimal di ujung
    let temp = parseFloat(value.toPrecision(12));
    
    // Jika bilangan bulat, kembalikan sebagai string biasa
    if (Math.abs(temp % 1) < 1e-10) {
        return Math.round(temp).toString();
    }
    
    return temp.toString();
}

function updateDisplays() {
    // Jika kosong
    if (!currentExpression && !currentResult) {
        expressionDisplay.textContent = '';
        resultDisplay.value = '0';
        return;
    }

    expressionDisplay.textContent = currentExpression;
    
    // Jika ada result, tampilkan result di layar utama. Jika tidak, tampilkan ekspresi yang sedang diketik
    if (currentResult) {
        resultDisplay.value = currentResult;
    } else {
        // Tampilkan bagian terakhir dari ekspresi (misal angka yang sedang diketik)
        // Logic sederhana: tampilkan full expression di input bawah jika belum ada hasil
        resultDisplay.value = currentExpression || '0';
    }
}

function appendToExpression(value) {
    // Jika tombol ditekan setelah hasil keluar (misal: tekan angka 5 setelah hasil 10)
    // Maka reset kalkulator dan mulai baru.
    // KECUALI jika yang ditekan adalah operator (+ - x /), maka lanjutkan dari hasil sebelumnya.
    if (currentResult) {
        if (isOperator(value)) {
            currentExpression = currentResult + value;
        } else {
            currentExpression = value;
        }
        currentResult = '';
    } else {
        currentExpression += value;
    }

    updateDisplays();
}

function clearAll() {
    currentExpression = '';
    currentResult = '';
    updateDisplays();
}

function backspace() {
    if (currentResult) {
        // Jika habis hitung, clear semua
        clearAll();
    } else {
        currentExpression = currentExpression.slice(0, -1);
        updateDisplays();
    }
}

function evaluateExpression(expression) {
    if (!expression) return 0;

    // Ubah simbol tampilan ke simbol JS yang valid
    let jsExpression = expression
        .replace(/x/g, '*')
        .replace(/÷/g, '/')
        .replace(/\^/g, '**');

    try {
        // Validasi keamanan sederhana
        if (/[^0-9+\-*/.()\s]/.test(jsExpression)) {
             // Hanya izinkan karakter matematika dasar
             throw new Error("Invalid char");
        }

        const result = Function('"use strict";return (' + jsExpression + ')')();
        return result;
    } catch (error) {
        throw new Error('Invalid expression');
    }
}

function calculateResult() {
    try {
        const baseExpression = currentExpression; // Hitung apa yang ada di ekspresi
        if (!baseExpression) return;

        const value = evaluateExpression(baseExpression);
        const formatted = formatNumber(value);
        
        if (formatted === 'Error') {
            resultDisplay.value = 'Error';
            return;
        }

        addToHistory(baseExpression, formatted);

        // Update state
        currentResult = formatted;
        // Tampilkan ekspresi lengkap di atas
        expressionDisplay.textContent = baseExpression + ' =';
        // Tampilkan hasil di layar utama
        resultDisplay.value = formatted;
        
    } catch (error) {
        resultDisplay.value = 'Error';
    }
}

function getCurrentValue() {
    // Fungsi bantu untuk Scientific (sin/cos)
    // Mengambil angka terakhir atau hasil yang ada
    try {
        if (currentResult) return parseFloat(currentResult);
        
        // Jika belum ada result, coba evaluasi ekspresi yang ada
        if (currentExpression) {
            return evaluateExpression(currentExpression);
        }
        return 0;
    } catch {
        return 0;
    }
}

function applyUnaryFunction(type) {
    let value = getCurrentValue();
    let result;
    let label;

    switch (type) {
        case 'sqrt':
            if (value < 0) return alert("Tidak bisa akar negatif");
            result = Math.sqrt(value);
            label = `√(${formatNumber(value)})`;
            break;
        case 'square':
            result = Math.pow(value, 2);
            label = `(${formatNumber(value)})²`;
            break;
        case 'percent':
            result = value / 100;
            label = `${formatNumber(value)}%`;
            break;
        case 'sin':
            result = Math.sin(value * Math.PI / 180); // Konversi ke radian
            label = `sin(${formatNumber(value)})`;
            break;
        case 'cos':
            result = Math.cos(value * Math.PI / 180);
            label = `cos(${formatNumber(value)})`;
            break;
        case 'tan':
            result = Math.tan(value * Math.PI / 180);
            label = `tan(${formatNumber(value)})`;
            break;
    }

    const formatted = formatNumber(result);
    addToHistory(label, formatted);
    
    currentResult = formatted;
    currentExpression = formatted; // Set expression jadi hasil agar bisa dilanjut
    
    expressionDisplay.textContent = label + ' =';
    resultDisplay.value = formatted;
}

function addToHistory(expression, result) {
    history.unshift({ expression, result });
    if (history.length > 10) history.pop(); // Simpan 10 terakhir saja biar rapi
    renderHistory();
}

function renderHistory() {
    historyList.innerHTML = '';
    if (history.length === 0) {
        historyEmpty.style.display = 'block';
        return;
    }
    historyEmpty.style.display = 'none';

    history.forEach(item => {
        const li = document.createElement('li');
        li.className = 'history-item';
        
        const exprDiv = document.createElement('div');
        exprDiv.className = 'history-expression';
        exprDiv.textContent = item.expression;
        
        const resDiv = document.createElement('div');
        resDiv.className = 'history-result';
        resDiv.textContent = '= ' + item.result;
        
        li.appendChild(exprDiv);
        li.appendChild(resDiv);
        
        li.addEventListener('click', () => {
            currentExpression = item.result; // Pakai hasil history
            currentResult = '';
            updateDisplays();
        });
        
        historyList.appendChild(li);
    });
}

clearHistoryButton.addEventListener('click', () => {
    history = [];
    renderHistory();
});

// --- Keyboard Support ---
window.addEventListener('keydown', (e) => {
    const key = e.key;
    if((key >= '0' && key <= '9') || key === '.') appendToExpression(key);
    if(key === '+' || key === '-') appendToExpression(key);
    if(key === '*' || key === 'x') appendToExpression('x');
    if(key === '/') appendToExpression('/');
    if(key === 'Enter' || key === '=') calculateResult();
    if(key === 'Backspace') backspace();
    if(key === 'Escape') clearAll();
});

// Init
updateDisplays();