// Precompute table of logarithms for (1+2^-k) for k=0,1,2,...,30
// This is used to compute the logarithm of a number in the range [1,2)

var log1p = new Float64Array(31);
var val1p = new Float64Array(31);
for (var i = 0; i < 31; i++) {
    val1p[i] = 1 + Math.pow(2, -i);
    log1p[i] = Math.log1p(Math.pow(2, -i));
}

// Compute the natural logarithm of x >= 1 using the precomputed table.
// Returns the result and the values of k corresponding to the factors of x.
function ln(x) {
    var res = 0;
    var ks = [];
    var k = 0, n = 1;
    while (true) {
        if (n * val1p[k] <= x) {
            res += log1p[k];
            n *= val1p[k];
            ks.push(k);
        } else {
            k++;
        }
        if (k >= 31) break;
    }
    return { res: res, steps: ks };
}

function computeLn() {
    var number = parseFloat(document.getElementById("inputNumber").value);
    if (isNaN(number) || number < 1) {
        alert("Invalid input. Please enter a number greater than or equal to 1.");
    } else {
        var r = ln(number);
        document.getElementById("outputResult").innerHTML = "ln(" + number + ") = " + r.res;
        if (number == 1) {
            document.getElementById("outputExplanation").innerHTML = "Try something more interesting!";
            return;
        }
        document.getElementById("outputExplanation").innerHTML = number + " is the product of the following factors, so its logarithm is the sum of the factors' (precomputed) logarithms.";

        var tab = document.getElementById("outputTable");
        // Build a new result table.
        tab.innerHTML = "";
        tab.classList.add("result-table");

        // Create the table header
        var thead = tab.createTHead();
        var tr = thead.insertRow(0);
        var th1 = document.createElement("th");
        th1.innerHTML = "n (factor)";
        tr.appendChild(th1);        
        var th2 = document.createElement("th");
        th2.innerHTML = "ln(n)";
        tr.appendChild(th2);
        
        // Create the table body
        var body = tab.createTBody();
        for (var i = 0; i < r.steps.length; i++) {
            var row = body.insertRow(i);
            // val1p expressed as fraction, but just "2" if k = 0.
            if (r.steps[i] == 0) {
                row.insertCell(0).innerHTML = "2";
            } else {
                row.insertCell(0).innerHTML = "1 + 2^(-" + r.steps[i] + ")";
            }
            row.insertCell(1).innerHTML = log1p[r.steps[i]].toFixed(20);
        }
    }
}
