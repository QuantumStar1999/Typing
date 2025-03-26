document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const customTextArea = document.getElementById('custom-text');
    const charCount = document.getElementById('char-count');
    const wordCount = document.getElementById('word-count');
    const saveTextBtn = document.getElementById('save-text');
    const deleteTextBtn = document.getElementById('delete-text');
    const savedTextsList = document.getElementById('saved-texts-list');
    const timerInput = document.getElementById('timer');
    const startTestBtn = document.getElementById('start-test');
    const typingTestSection = document.querySelector('.typing-test');
    const testTextDiv = document.getElementById('test-text');
    const userInput = document.getElementById('user-input');
    const submitTestBtn = document.getElementById('submit-test');
    const timeDisplay = document.getElementById('time-display');
    const resultsSection = document.querySelector('.results');
    const wpmDisplay = document.getElementById('wpm');
    const accuracyDisplay = document.getElementById('accuracy');
    const correctCharsDisplay = document.getElementById('correct-chars');
    const incorrectCharsDisplay = document.getElementById('incorrect-chars');
    const markedTextDiv = document.getElementById('marked-text');
    const newTestBtn = document.getElementById('new-test');
    const textManagementSection = document.getElementById('text-management');
    const testSettingsSection = document.getElementById('test-settings');
    const performanceChartCtx = document.getElementById('performance-chart').getContext('2d');

    // Variables
    let timer;
    let timeLeft;
    let testActive = false;
    let startTime;
    let originalText = '';
    let testText = '';
    let performanceChart;
    let testHistory = JSON.parse(localStorage.getItem('typingTestHistory') || '[]');

    

    // Initialize
    initializeSampleTexts();
    updateTextSummary();
    loadSavedTexts();
    if (testHistory.length > 0) {
        renderPerformanceChart();
    }

    // Event Listeners
    customTextArea.addEventListener('input', updateTextSummary);
    saveTextBtn.addEventListener('click', saveText);
    deleteTextBtn.addEventListener('click', deleteText);
    savedTextsList.addEventListener('change', loadSelectedText);
    startTestBtn.addEventListener('click', startTest);
    submitTestBtn.addEventListener('click', submitTest);
    newTestBtn.addEventListener('click', resetTest);
    userInput.addEventListener('input', checkTyping);
    
    // Disable copy-paste and other shortcuts
    userInput.addEventListener('keydown', function(e) {
        if (e.ctrlKey && (e.keyCode === 65 || e.keyCode === 67 || e.keyCode === 86 || e.keyCode === 88)) {
            e.preventDefault();
            return false;
        }
        if (e.keyCode === 93) {
            e.preventDefault();
            return false;
        }
    });
    
    userInput.addEventListener('contextmenu', function(e) {
        e.preventDefault();
        return false;
    });

    // Functions
    function initializeSampleTexts() {
        const savedTexts = JSON.parse(localStorage.getItem('savedTexts') || '[]');
        // const hasSamples = savedTexts.some(text => text.title.length!==0);
        const hasSamples = savedTexts.length!==0
        
        if (!hasSamples) {
            const allTexts = [...sampleTexts, ...savedTexts];
            // Update the sampleTexts array with numbered titles
            for (let i = 0; i < allTexts.length; i++) {
                allTexts[i].title = `${i + 1}. ${allTexts[i].title}`;
            }
            localStorage.setItem('savedTexts', JSON.stringify(allTexts));
        }
        else{
            // Update the sampleTexts array with numbered titles
            for (let i = 0; i < sampleTexts.length; i++) {
                sampleTexts[i].title = `${i + 1}. ${sampleTexts[i].title}`;
            }
            localStorage.setItem('savedTexts', JSON.stringify(sampleTexts));
        }
    }

    function updateTextSummary() {
        const text = customTextArea.value;
        const charCountValue = text.length;
        const wordCountValue = text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
        
        charCount.textContent = `${charCountValue} characters`;
        wordCount.textContent = `${wordCountValue} words`;
    }

    function saveText() {
        const text = customTextArea.value.trim();
        if (text === '') {
            alert('Please enter some text to save.');
            return;
        }

        const title = prompt('Enter a name for this text:', `Custom Text ${savedTextsList.options.length + 1}`);
        if (title === null) return;

        const savedTexts = JSON.parse(localStorage.getItem('savedTexts') || '[]');
        savedTexts.push({ title, text });
        localStorage.setItem('savedTexts', JSON.stringify(savedTexts));

        loadSavedTexts();
        customTextArea.value = '';
        updateTextSummary();
    }

    function loadSavedTexts() {
        const savedTexts = JSON.parse(localStorage.getItem('savedTexts') || '[]');
        savedTextsList.innerHTML = '';
        
        savedTexts.forEach((item, index) => {
            const option = document.createElement('option');
            option.value = index;
            option.textContent = item.title;
            savedTextsList.appendChild(option);
        });
    }

    function loadSelectedText() {
        const selectedIndex = savedTextsList.value;
        if (selectedIndex === '') return;

        const savedTexts = JSON.parse(localStorage.getItem('savedTexts') || '[]');
        customTextArea.value = savedTexts[selectedIndex].text;
        updateTextSummary();
    }

    function deleteText() {
        const selectedIndex = savedTextsList.value;
        if (selectedIndex === '') {
            alert('Please select a text to delete.');
            return;
        }

        const savedTexts = JSON.parse(localStorage.getItem('savedTexts') || '[]');
        const textToDelete = savedTexts[selectedIndex].title;
        
        if (textToDelete.includes("Sample")) {
            alert('Sample texts cannot be deleted.');
            return;
        }

        if (!confirm(`Are you sure you want to delete "${textToDelete}"?`)) return;

        savedTexts.splice(selectedIndex, 1);
        localStorage.setItem('savedTexts', JSON.stringify(savedTexts));

        loadSavedTexts();
        customTextArea.value = '';
        updateTextSummary();
    }

    function startTest() {
        const selectedIndex = savedTextsList.value;
        if (selectedIndex === '' && customTextArea.value.trim() === '') {
            alert('Please select a saved text or enter custom text for the test.');
            return;
        }

        // Get the text for the test
        /*
        if (selectedIndex !== '') {
            const savedTexts = JSON.parse(localStorage.getItem('savedTexts') || '[]');
            testText = savedTexts[selectedIndex].text;
        } else {
            testText = customTextArea.value;
        }
        */
        testText = customTextArea.value;

        originalText = testText;
        testTextDiv.textContent = testText;
        userInput.value = '';
        userInput.disabled = false;
        submitTestBtn.disabled = false;

        // Set up timer
        const minutes = parseInt(timerInput.value) || 15;
        timeLeft = minutes * 60;
        updateTimerDisplay();

        // Start timer
        clearInterval(timer);
        timer = setInterval(() => {
            timeLeft--;
            updateTimerDisplay();

            if (timeLeft <= 0) {
                clearInterval(timer);
                submitTest();
            }
        }, 1000);

        // Record start time
        startTime = new Date();
        testActive = true;

        // Hide unnecessary sections
        textManagementSection.classList.add('hidden');
        testSettingsSection.classList.add('hidden');
        
        // Show typing test section
        typingTestSection.classList.remove('hidden');
        resultsSection.classList.add('hidden');

        // Focus on input
        setTimeout(() => {
            userInput.focus();
        }, 100);
    }

    function updateTimerDisplay() {
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        timeDisplay.textContent = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    }

    function checkTyping() {
        if (!testActive) return;

        const userText = userInput.value;
        let displayText = '';
        let correctChars = 0;

        for (let i = 0; i < userText.length; i++) {
            if (i < originalText.length && userText[i] === originalText[i]) {
                displayText += `<span class="correct">${originalText[i]}</span>`;
                correctChars++;
            } else {
                if (i < originalText.length) {
                    displayText += `<span class="incorrect">${originalText[i]}</span>`;
                }
            }
        }

        // Add remaining original text
        if (userText.length < originalText.length) {
            displayText += originalText.substring(userText.length);
        }

        testTextDiv.innerHTML = displayText;
    }

    function submitTest() {
        if (!testActive) return;

        clearInterval(timer);
        testActive = false;
        userInput.disabled = true;
        submitTestBtn.disabled = true;

        const endTime = new Date();
        const timeTaken = (endTime - startTime) / 1000 / 60; // in minutes
        const userText = userInput.value;

        // Calculate metrics
        let correctChars = 0;
        let incorrectChars = 0;
        let markedText = '';

        for (let i = 0; i < userText.length; i++) {
            if (i < originalText.length && userText[i] === originalText[i]) {
                markedText += `<span class="correct">${userText[i]}</span>`;
                correctChars++;
            } else {
                if (i < originalText.length) {
                    markedText += `<span class="incorrect">${originalText[i]}</span>`;
                } else {
                    markedText += `<span class="incorrect">${userText[i]}</span>`;
                }
                incorrectChars++;
            }
        }

        // Add remaining original text as incorrect if user didn't type enough
        if (userText.length < originalText.length) {
            for (let i = userText.length; i < originalText.length; i++) {
                markedText += `<span class="incorrect">${originalText[i]}</span>`;
                incorrectChars++;
            }
        }

        const totalChars = originalText.length;
        const accuracy = totalChars > 0 ? Math.round((correctChars / totalChars) * 100) : 0;
        const words = userText.trim().split(/\s+/).length;
        const wpm = timeTaken > 0 ? Math.round(words / timeTaken) : 0;

        // Save test results to history
        const testResult = {
            date: new Date().toISOString(),
            wpm,
            accuracy,
            correctChars,
            incorrectChars
        };
        
        testHistory.unshift(testResult);
        if (testHistory.length > 20) {
            testHistory.pop();
        }
        
        localStorage.setItem('typingTestHistory', JSON.stringify(testHistory));

        // Display results
        wpmDisplay.textContent = wpm;
        accuracyDisplay.textContent = accuracy;
        correctCharsDisplay.textContent = correctChars;
        incorrectCharsDisplay.textContent = incorrectChars;
        markedTextDiv.innerHTML = markedText;

        // Update performance chart
        renderPerformanceChart();

        // Show results section and hide test section
        typingTestSection.classList.add('hidden');
        resultsSection.classList.remove('hidden');
    }

    function renderPerformanceChart() {
        if (performanceChart) {
            performanceChart.destroy();
        }
        
        const last20Tests = testHistory.slice(0, 20).reverse();
        const labels = last20Tests.map((test, index) => `Test ${index + 1}`);
        const wpmData = last20Tests.map(test => test.wpm);
        const accuracyData = last20Tests.map(test => test.accuracy);
        
        performanceChart = new Chart(performanceChartCtx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'WPM',
                        data: wpmData,
                        borderColor: '#4361ee',
                        backgroundColor: 'rgba(67, 97, 238, 0.1)',
                        tension: 0.3,
                        fill: true
                    },
                    {
                        label: 'Accuracy %',
                        data: accuracyData,
                        borderColor: '#4cc9f0',
                        backgroundColor: 'rgba(76, 201, 240, 0.1)',
                        tension: 0.3,
                        fill: true
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        title: {
                            display: true,
                            text: 'WPM / Accuracy'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Test Attempts'
                        }
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            afterLabel: function(context) {
                                const index = context.dataIndex;
                                const test = last20Tests[index];
                                return [
                                    `Correct: ${test.correctChars}`,
                                    `Incorrect: ${test.incorrectChars}`,
                                    `Date: ${new Date(test.date).toLocaleString()}`
                                ];
                            }
                        }
                    }
                }
            }
        });
    }

    function resetTest() {
        // Show the initial sections again
        textManagementSection.classList.remove('hidden');
        testSettingsSection.classList.remove('hidden');
        
        // Hide results
        resultsSection.classList.add('hidden');
        
        // Reset input
        userInput.value = '';
        testTextDiv.textContent = '';
    }
});