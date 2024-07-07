// Function to format number with spaces
function formatNumber(number) {
    return number ? number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') : '';
}

// Function to parse number from formatted string
function parseNumber(numberString) {
    return parseInt(numberString.replace(/\s/g, ''), 10) || 0;
}

// Function to calculate points based on input values
function calculatePoints() {
    const numberOfBoosts = parseNumber(document.getElementById('numberOfBoosts').value);
    const currentScore = parseNumber(document.getElementById('currentScore').value);
    const currentBadges = parseNumber(document.getElementById('currentBadges').value);
    const pointsPerMultiLive = parseNumber(document.getElementById('pointsPerMultiLive').value);
    const pointsPerChallengeLive = parseNumber(document.getElementById('pointsPerChallengeLive').value);
    const badgesPerMultiLive = parseNumber(document.getElementById('badgesPerMultiLive').value);
    const badgesForChallengeLive = parseNumber(document.getElementById('badgesForChallengeLive').value);

    let multiLiveRuns = 0;
    let totalBadges = currentBadges;
    let totalPoints = currentScore;
    let challengeLiveRuns = 0;
    let boostsUsed = 0;

    // Calculate points based on the number of boosts
    while (boostsUsed < numberOfBoosts) {
        if (totalBadges >= badgesForChallengeLive) {
            totalPoints += pointsPerChallengeLive;
            totalBadges -= badgesForChallengeLive;
            challengeLiveRuns += 1;
            boostsUsed += 3; // 3 boosts = 1 live
        } else {
            totalPoints += pointsPerMultiLive;
            totalBadges += badgesPerMultiLive;
            multiLiveRuns += 1;
            boostsUsed += 3; // 3 boosts = 1 live
        }
    }

    // Display the results only if there are results to show
    if (multiLiveRuns > 0 || challengeLiveRuns > 0) {
        displayResult(multiLiveRuns, challengeLiveRuns, totalPoints, currentScore, currentBadges, boostsUsed);
        document.querySelector('.result').style.display = 'block'; // Show the result section
    } else {
        document.querySelector('.result').style.display = 'none'; // Hide the result section if no results
    }
}

// Function to display results in the result section
function displayResult(multiLiveRuns, challengeLiveRuns, finalScore, currentScore, currentBadges, boostsUsed) {
    document.getElementById('resultCurrentScore').innerText = formatNumber(currentScore);
    document.getElementById('resultCurrentBadges').innerText = formatNumber(currentBadges);
    document.getElementById('resultBoostsUsed').innerText = boostsUsed;
    document.getElementById('resultMultiLiveRuns').innerText = multiLiveRuns;
    document.getElementById('resultChallengeLiveRuns').innerText = challengeLiveRuns;
    document.getElementById('resultFinalScore').innerText = formatNumber(finalScore);
}

// Event listener for Enter key press (optional)
document.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        calculatePoints();
    }
});

// Event listeners for input formatting (already provided)
document.querySelectorAll('input[type="text"]').forEach(input => {
    input.addEventListener('input', (e) => {
        e.target.value = formatNumber(parseNumber(e.target.value));
    });
});

// Wait for the DOM to be fully loaded
document.addEventListener("DOMContentLoaded", function() {
    // Find the Calculate button by its ID and add a click event listener
    var calculateButton = document.getElementById("calculateButton");
    calculateButton.addEventListener("click", function() {
        calculatePoints();
    });

    // Initially hide the result section on page load
    document.querySelector('.result').style.display = 'none';
});
