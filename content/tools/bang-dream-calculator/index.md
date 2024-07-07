<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>BanG Dream! Points Calculator</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
{{< return_home >}}
    <div class="container">
        <div class="main-content">
            <h1>BanG Dream! Points Calculator</h1>
            <div class="mode-toggle">
                <label>
                    <input type="radio" name="mode" value="max" checked> Max Points
                </label>
                <label>
                    <input type="radio" name="mode" value="goal"> Specific Goal
                </label>
            </div>
            <div class="input-group" id="maxPointsMode">
                <label for="numberOfBoosts">Number of Live Boosts:</label>
                <input type="text" id="numberOfBoosts" value="0" required>
            </div>
            <div class="input-group" id="specificGoalMode" style="display: none;">
                <label for="goalPoints">Target Score:</label>
                <input type="text" id="goalPoints" value="0" required>
            </div>
            <form id="pointsForm">
                <div class="input-group">
                    <label for="currentScore">Current Score:</label>
                    <input type="text" id="currentScore" value="0" required>
                </div>
                <div class="input-group">
                    <label for="currentBadges">Current Badges:</label>
                    <input type="text" id="currentBadges" value="0" required>
                </div>
                <button type="button" id="calculateButton">Calculate</button>
            </form>
            <div id="result" class="result">
                <div class="result-box">
                    <p class="result-title">Results</p>
                    <div class="result-item">
                        <span>Remaining Badges:</span>
                        <span id="resultRemainingBadges"></span>
                    </div>
                    <div class="result-item">
                        <span>Live Boosts Used:</span>
                        <span id="resultBoostsUsed"></span>
                    </div>
                    <div class="result-item">
                        <span>Multi Lives Done:</span>
                        <span id="resultMultiLiveRuns"></span>
                    </div>
                    <div class="result-item">
                        <span>Challenge Lives Done:</span>
                        <span id="resultChallengeLiveRuns"></span>
                    </div>
                    <div class="result-item final-score">
                        <span>Final Score:</span>
                        <span id="resultFinalScore"></span>
                    </div>
                </div>
            </div>
        </div>
        <div class="sidebar">
            <div class="sidebar-header">
                <h2>Customize</h2>
            </div>
            <div id="customizeOptions">
                <div class="input-group">
                    <label for="pointsPerMultiLive">Points per Multi Live:</label>
                    <input type="text" id="pointsPerMultiLive" value="6 800">
                </div>
                <div class="input-group">
                    <label for="pointsPerChallengeLive">Points per Challenge Live:</label>
                    <input type="text" id="pointsPerChallengeLive" value="33 000">
                </div>
                <div class="input-group">
                    <label for="badgesPerMultiLive">Badges per Multi Live:</label>
                    <input type="text" id="badgesPerMultiLive" value="330">
                </div>
                <div class="input-group">
                    <label for="badgesForChallengeLive">Badges for Challenge Live:</label>
                    <input type="text" id="badgesForChallengeLive" value="800">
                </div>
            </div>
        </div>
    </div>
    <script src="scripts.js"></script>
</body>
</html>
