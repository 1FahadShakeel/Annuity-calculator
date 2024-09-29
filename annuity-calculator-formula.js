$(document).ready(function () {
    $('[data-toggle="tooltip"]').tooltip();
    calculate();
});

function formatNumber(num) {
    if (num >= 1000) {
        return (num / 1000).toFixed(0) + 'K'; // Round to the nearest whole number
    }
    return num.toString(); // Return the number as is if it's less than 1000
}


// Select the radio buttons and the target div
const fixedPeriodRadio = document.getElementById('fixedPeriod');
const incomeNeededRadio = document.getElementById('incomeNeeded');
const yearsQuestion = document.getElementById('yearsQuestion');
const amountQuestion = document.getElementById('amountQuestion');

// Function to handle the radio button change
function handleRadioChange() {
    if (fixedPeriodRadio.checked) {
        yearsQuestion.classList.remove('d-none'); // Show the target div
        amountQuestion.classList.add('d-none'); // Hide the target div
    } else if (incomeNeededRadio.checked) {
        yearsQuestion.classList.add('d-none'); // Hide the target div
        amountQuestion.classList.remove('d-none'); // Hide the target div
    }
}

// Add event listeners to the radio buttons
fixedPeriodRadio.addEventListener('click', handleRadioChange);
incomeNeededRadio.addEventListener('click', handleRadioChange);

// Initial state check on page load
handleRadioChange();


function validateDecimals(id) {
    let inputted = parseFloat(document.getElementById(id).value.replace(/,/g, ''));
    document.getElementById(id).value = toComma2(inputted.toFixed(2));
    calculate();

}

function calculate() {


    let monthlyWithdrawalAmount = parseFloat(document.getElementById("monthlyWithdrawalAmount").value.replace(/,/g, ''));
    let yearsToPayout = parseFloat(document.getElementById("yearsToPayout").value);
    let startingPrincipal = parseFloat(document.getElementById("startingPrincipal").value.replace(/,/g, ''));
    let interestRate = parseFloat(document.getElementById("interestRate").value);
    const monthlyInterestRate = interestRate / 1200;
    let monthlyPayment = 0; //what would be the monthly payout
    let totalPayments = 0; // number of monthly payments

    if (fixedPeriodRadio.checked) {
        totalPayments = yearsToPayout * 12;
        // Annuity monthly withdrawal formula
        monthlyPayment = (startingPrincipal * monthlyInterestRate) / (1 - Math.pow(1 + monthlyInterestRate, -totalPayments));

    } else if (incomeNeededRadio.checked) {
        monthlyPayment = monthlyWithdrawalAmount;
        totalPayments = Math.log(1 / (1 - (startingPrincipal * monthlyInterestRate) / monthlyPayment))
            / Math.log(1 + monthlyInterestRate);

    }


    // Calculate total interest earned
    const totalPaid = monthlyPayment * totalPayments;
    const totalInterest = totalPaid - startingPrincipal;

    const interestEarnedOutput = document.querySelectorAll('.totalInterestEarned');
    const monthlyAmountForWithdrawalOutput = document.querySelectorAll('.monthlyAmountForWithdrawal');
    interestEarnedOutput.forEach(el => {
        el.textContent = toComma(totalInterest.toFixed(0));
    });
    monthlyAmountForWithdrawalOutput.forEach(el => {
        el.textContent = toComma(monthlyPayment.toFixed(0));
    });

    // Update Numbers in the output
    document.getElementById('years').textContent = (totalPayments / 12).toFixed(2);
    document.getElementById('startingPrincipalValue').textContent = toComma(startingPrincipal);
    document.getElementById('preApprovedNumber').textContent = '$' + formatNumber(startingPrincipal);
    document.getElementById('interestRateValue').textContent = interestRate + '%';

    document.getElementById('totalPaymentsAmount').textContent = toComma(totalPaid.toFixed(0));
    document.getElementById('totalPayments').textContent = totalPayments.toFixed(0);

    // Generate data for the chart and table
    let remainingBalance = startingPrincipal;
    let balanceData = [];
    let interestData = [];
    let breakdownTable = document.querySelector('#tableBody');
    breakdownTable.innerHTML = '';
    let yearlyInterest = 0;

    for (let i = 1; i <= totalPayments; i++) {
        let interest = remainingBalance * monthlyInterestRate;
        let newRemainingBalance = remainingBalance + interest - monthlyPayment;
        remainingBalance = Math.max(0, newRemainingBalance); // Avoid negative balance
        yearlyInterest += interest;

        // Every 12 months (1 year), push data to the arrays
        if (i % 12 === 0 || i === totalPayments) {
            let year = i / 12;
            balanceData.push([year, remainingBalance]);
            interestData.push([year, yearlyInterest]);
            yearlyInterest = 0;
        }


        // Append to table
        let row = `<tr>
                    <td>${i}</td>
                    <td>${toComma(monthlyPayment.toFixed(2))}</td>
                    <td>${toComma(interest.toFixed(2))}</td>
                    <td style="text-align: center">${toComma(remainingBalance.toFixed(2))}</td>
                </tr>`;
        breakdownTable.innerHTML += row;
    }

    renderChart(balanceData, interestData);


}


// Render the balance over time chart
function renderChart(balanceData, interestData) {
    const options = {
        chart: {
            type: 'line',
            height: 350,
            toolbar: {
                show: false // Disable export, zoom options, etc.
            }
        },
        series: [{
            name: 'Annuity Balance',
            data: balanceData
        },
            {
                name: 'Interest Earned',
                data: interestData
            }],
        colors: ['#00B5D5', '#F87171'],
        xaxis: {
            type: 'text',
            title: {
                text: 'Years'
            }
        },
        yaxis: {
            title: {
                text: 'Balance'
            },
            labels: {
                // Format y-axis values with commas, no decimals
                formatter: function (value) {
                    return value.toLocaleString('en-US', {
                        maximumFractionDigits: 0
                    });
                }
            }
        },
        tooltip: {
            y: {
                // Format tooltip values similarly (commas, no decimals)
                formatter: function (value) {
                    return '$' + value.toLocaleString('en-US', {
                        maximumFractionDigits: 0
                    });
                }
            },
            x: {
                formatter: function (value) {
                    return 'Year ' + value;
                }
            }
        },
        stroke: {
            curve: 'smooth' // Makes the line curve for a smoother look
        },
        dataLabels: {
            enabled: false // Disable data labels on the chart itself
        },
        markers: {
            size: 5 // Add a slight marker to indicate data points
        },
        grid: {
            show: true,
            borderColor: '#e7e7e7'
        },
        theme: {
            // Set font family to Montserrat
            fontFamily: 'Montserrat, sans-serif'
        }
    };

    const chart = new ApexCharts(document.querySelector("#lineChart"), options);
    chart.render();
}


function toComma(x) {
    return "$ " + x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function toComma2(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}


function format(input) {
    var nStr = input.value + '';
    nStr = nStr.replace(/\,/g, "");
    x = nStr.split('.');
    x1 = x[0];
    x2 = x.length > 1 ? '.' + x[1] : '';
    var rgx = /(\d+)(\d{3})/;
    while (rgx.test(x1)) {
        x1 = x1.replace(rgx, '$1' + ',' + '$2');
    }
    input.value = x1 + x2;
}
