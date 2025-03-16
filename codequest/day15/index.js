
const input = document.getElementById("input");
const fromSelect = document.getElementById("from");
const toSelect = document.getElementById("to");
const resultElement = document.getElementById("result");
const convertBtn = document.getElementById("convert-btn");
convertBtn.addEventListener("click", fr);

function fr() {
    const inputValue = parseFloat(input.value);
    if (isNaN(inputValue)) {
        resultElement.textContent = "-";
        return;
    }
    const fromUnit = fromSelect.value;
    const toUnit = toSelect.value;
    const result = konversi(inputValue, fromUnit, toUnit);
    resultElement.textContent = result.toFixed(2);
}

function konversi(num, from, to) {
    if (from === to) {
        return num;
    }
    
    
    let celsius;
    
    switch (from) {
        case "c": // Celsius
            celsius = num;
            break;
        case "f": // Fahrenheit
            celsius = (num - 32) * 5/9;
            break;
        case "k": // Kelvin
            celsius = num - 273.15;
            break;
        case "r": // Reamur
            celsius = num * 5/4;
            break;
    }
    
    switch (to) {
        case "c": // Celsius
            return celsius;
        case "f": // Fahrenheit
            return celsius * 9/5 + 32;
        case "k": // Kelvin
            return celsius + 273.15;
        case "r": // Reamur
            return celsius * 4/5;
    }
}
