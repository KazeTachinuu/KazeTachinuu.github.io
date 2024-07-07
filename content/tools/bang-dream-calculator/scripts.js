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
    const mode = getCurrentMode();
    const currentScore = parseNumber(document.getElementById('currentScore').value);
    const currentBadges = parseNumber(document.getElementById('currentBadges').value);

    if (mode === 'max') {
        const numberOfBoosts = parseNumber(document.getElementById('numberOfBoosts').value);
        const pointsPerMultiLive = parseNumber(document.getElementById('pointsPerMultiLive').value);
        const pointsPerChallengeLive = parseNumber(document.getElementById('pointsPerChallengeLive').value);
        const badgesPerMultiLive = parseNumber(document.getElementById('badgesPerMultiLive').value);
        const badgesForChallengeLive = parseNumber(document.getElementById('badgesForChallengeLive').value);

        let multiLiveRuns = 0;
        let totalBadges = currentBadges;
        let totalPoints = currentScore;
        let challengeLiveRuns = 0;
        let boostsUsed = 0;

        while (boostsUsed < numberOfBoosts || totalBadges >= badgesForChallengeLive) {
            if (totalBadges >= badgesForChallengeLive) {
                totalPoints += pointsPerChallengeLive;
                totalBadges -= badgesForChallengeLive;
                challengeLiveRuns += 1;
            } else {
                totalPoints += pointsPerMultiLive;
                totalBadges += badgesPerMultiLive;
                multiLiveRuns += 1;
                boostsUsed += 3;
            }
        }

        if (multiLiveRuns > 0 || challengeLiveRuns > 0) {
            displayResult(multiLiveRuns, challengeLiveRuns, totalPoints, totalBadges, boostsUsed);
            document.querySelector('.result').style.display = 'block';
        } else {
            document.querySelector('.result').style.display = 'none';
        }
    } else if (mode === 'goal') {
        const goalPoints = parseNumber(document.getElementById('goalPoints').value);
        const pointsPerMultiLive = parseNumber(document.getElementById('pointsPerMultiLive').value);
        const pointsPerChallengeLive = parseNumber(document.getElementById('pointsPerChallengeLive').value);
        const badgesPerMultiLive = parseNumber(document.getElementById('badgesPerMultiLive').value);
        const badgesForChallengeLive = parseNumber(document.getElementById('badgesForChallengeLive').value);

        let multiLiveRuns = 0;
        let totalBadges = currentBadges;
        let totalPoints = currentScore;
        let challengeLiveRuns = 0;
        let boostsUsed = 0;

        while (totalPoints < goalPoints) {
            if (totalBadges >= badgesForChallengeLive) {
                totalPoints += pointsPerChallengeLive;
                totalBadges -= badgesForChallengeLive;
                challengeLiveRuns += 1;
            } else {
                totalPoints += pointsPerMultiLive;
                totalBadges += badgesPerMultiLive;
                multiLiveRuns += 1;
                boostsUsed += 3;
            }
        }

        displayResult(multiLiveRuns, challengeLiveRuns, totalPoints, totalBadges, boostsUsed);
        document.querySelector('.result').style.display = 'block';
    }
}

// Function to display results in the result section
function displayResult(multiLiveRuns, challengeLiveRuns, finalScore, remainingBadges, boostsUsed) {
    document.getElementById('resultRemainingBadges').innerText = formatNumber(remainingBadges);
    document.getElementById('resultBoostsUsed').innerText = boostsUsed;
    document.getElementById('resultMultiLiveRuns').innerText = multiLiveRuns;
    document.getElementById('resultChallengeLiveRuns').innerText = challengeLiveRuns;
    document.getElementById('resultFinalScore').innerText = formatNumber(finalScore);
}

// Function to check which mode is selected
function getCurrentMode() {
    return document.querySelector('input[name="mode"]:checked').value;
}

// Function to update inputs based on the selected mode
function updateInputs() {
    const mode = getCurrentMode();

    if (mode === 'max') {
        document.getElementById('maxPointsMode').style.display = 'block';
        document.getElementById('specificGoalMode').style.display = 'none';
    } else if (mode === 'goal') {
        document.getElementById('maxPointsMode').style.display = 'none';
        document.getElementById('specificGoalMode').style.display = 'block';
    }
}

// Event listener for mode change
document.querySelectorAll('input[name="mode"]').forEach(input => {
    input.addEventListener('change', updateInputs);
});

// Event listener for Calculate button click
document.getElementById('calculateButton').addEventListener('click', calculatePoints);

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
    // Initially hide the result section on page load
    document.querySelector('.result').style.display = 'none';
});
