let names = [];
let currentIndex = 0;
let approvedNames = JSON.parse(localStorage.getItem('approvedNames')) || [];
let rejectedNames = JSON.parse(localStorage.getItem('rejectedNames')) || [];
let lastEvaluatedName = null;
let lastEvaluation = null;
let startX = 0;
let isSwiping = false;
let icelandicVoices = [];

const nameDisplay = document.getElementById('name-display');
const progressDisplay = document.getElementById('progress-display');
const shortlistElement = document.getElementById('shortlist');
const toggleShortlistButton = document.getElementById('toggle-shortlist-button');
const nameCard = document.getElementById('name-card');
const undoButton = document.getElementById('undo-button');
const speakIcon = document.getElementById('speak-icon');

function initializeVoices() {
    return new Promise((resolve) => {
        const voices = speechSynthesis.getVoices();
        if (voices.length !== 0) {
            listVoices();
            resolve();
        } else {
            speechSynthesis.onvoiceschanged = () => {
                listVoices();
                resolve();
            };
        }
    });
}

// Function to list voices and filter for Icelandic voices
function listVoices() {
    const voices = speechSynthesis.getVoices();
    icelandicVoices = voices.filter(voice => voice.lang === 'is-IS');

    if (icelandicVoices.length > 0) {
        console.log('Icelandic voices found:', icelandicVoices);
    } else {
        console.log('No Icelandic voices found.');
    }
}

async function speakName(name) {
    await initializeVoices();

    if (icelandicVoices.length === 0) {
        console.warn('No Icelandic voice available, using audio fallback.');
        playAudioFallback(name);
        return;
    }

    const randomIndex = Math.floor(Math.random() * icelandicVoices.length);
    const utterance = new SpeechSynthesisUtterance(name);
    utterance.voice = icelandicVoices[randomIndex];
    utterance.onstart = () => {
        console.log('Speech started for:', name);
    };
    utterance.onend = () => {
        console.log('Speech ended for:', name);
    };
    speechSynthesis.speak(utterance);
}

function playAudioFallback(name) {
    const audioElement = document.getElementById('audio-fallback');
    audioElement.src = `audio/${name}.webm`;
    audioElement.play();
}

async function loadNames() {
    const response = await fetch('names.txt');
    const text = await response.text();
    names = text.split('\n').map(name => name.trim()).filter(name => name !== '');
    updateNameDisplay();
}

function updateProgressDisplay() {
    progressDisplay.textContent = `Approved: ${approvedNames.length}, Rejected: ${rejectedNames.length}, Total: ${names.length}`;
}

function toggleShortlist() {
    if (shortlistElement.style.display === 'none' || !shortlistElement.style.display) {
        shortlistElement.innerHTML = "<ul>" + approvedNames.map(name => `<li>${name}</li>`).join('') + "</ul>";
        shortlistElement.style.display = 'block';
        toggleShortlistButton.textContent = "Hide Shortlist";
    } else {
        shortlistElement.style.display = 'none';
        toggleShortlistButton.textContent = "Show Shortlist";
    }
}

function getRandomName() {
    let availableNames = names.filter(name =>
        !approvedNames.includes(name) && !rejectedNames.includes(name)
    );
    if (availableNames.length === 0) {
        return null;
    }
    const randomIndex = Math.floor(Math.random() * availableNames.length);
    return availableNames[randomIndex];
}

function updateNameDisplay() {
    const nextName = getRandomName();
    if (nextName) {
        nameDisplay.textContent = nextName;
        speakName(nextName); // Speak the name
        nameCard.style.transform = 'translateX(0)';
        nameCard.style.opacity = '1';
        nameCard.style.backgroundColor = '';  // Reset background color
    } else {
        nameDisplay.textContent = "No more names!";
        document.querySelector('.buttons').style.display = 'none';
    }
    updateProgressDisplay();
    updateUndoButtonState();
}

function updateUndoButtonState() {
    if (lastEvaluatedName) {
        undoButton.disabled = false;
    } else {
        undoButton.disabled = true;
    }
}

function handleAccept() {
    const currentName = nameDisplay.textContent;
    if (currentName && !approvedNames.includes(currentName)) {
        approvedNames.push(currentName);
        lastEvaluatedName = currentName;
        lastEvaluation = 'approved';
        localStorage.setItem('approvedNames', JSON.stringify(approvedNames));
        nameCard.style.transform = 'translateX(0)';  // Reset position
        updateNameDisplay();
    }
}

function handleReject() {
    const currentName = nameDisplay.textContent;
    if (currentName && !rejectedNames.includes(currentName)) {
        rejectedNames.push(currentName);
        lastEvaluatedName = currentName;
        lastEvaluation = 'rejected';
        localStorage.setItem('rejectedNames', JSON.stringify(rejectedNames));
        nameCard.style.transform = 'translateX(0)';  // Reset position
        updateNameDisplay();
    }
}

function handleUndo() {
    if (lastEvaluatedName) {
        if (lastEvaluation === 'approved') {
            approvedNames = approvedNames.filter(name => name !== lastEvaluatedName);
            localStorage.setItem('approvedNames', JSON.stringify(approvedNames));
        } else if (lastEvaluation === 'rejected') {
            rejectedNames = rejectedNames.filter(name => name !== lastEvaluatedName);
            localStorage.setItem('rejectedNames', JSON.stringify(rejectedNames));
        }
        nameDisplay.textContent = lastEvaluatedName;
        speakName(lastEvaluatedName);
        lastEvaluatedName = null;
        lastEvaluation = null;
        document.querySelector('.buttons').style.display = 'flex';
        nameCard.style.transform = 'translateX(0)';
        nameCard.style.opacity = '1';
        nameCard.style.backgroundColor = '';  // Reset background color
        updateProgressDisplay();
        updateUndoButtonState();
    }
}

function handleTouchStart(event) {
    startX = event.touches[0].clientX;
    isSwiping = true;
}

function handleTouchMove(event) {
    if (!isSwiping) return;
    const currentX = event.touches[0].clientX;
    const deltaX = currentX - startX;
    nameCard.style.transform = `translateX(${deltaX}px)`;
    event.preventDefault(); // Prevent default touch behavior

    // Change background color based on swipe direction
    if (deltaX > 0) {
        nameCard.style.backgroundColor = `rgba(0, 255, 0, ${Math.min(deltaX / 300, 1)})`;
    } else {
        nameCard.style.backgroundColor = `rgba(255, 0, 0, ${Math.min(-deltaX / 300, 1)})`;
    }
}

function handleTouchEnd(event) {
    if (!isSwiping) return;
    const endX = event.changedTouches[0].clientX;
    const deltaX = endX - startX;

    if (deltaX > 100) {
        // Swipe right
        nameCard.classList.add('swipe-right');
        setTimeout(() => {
            nameCard.classList.remove('swipe-right');
            handleAccept();
        }, 300);
    } else if (deltaX < -100) {
        // Swipe left
        nameCard.classList.add('swipe-left');
        setTimeout(() => {
            nameCard.classList.remove('swipe-left');
            handleReject();
        }, 300);
    } else {
        nameCard.style.transform = 'translateX(0)';
        nameCard.style.backgroundColor = '';  // Reset background color
    }

    isSwiping = false;
}

document.getElementById('accept-button').addEventListener('click', handleAccept);
document.getElementById('reject-button').addEventListener('click', handleReject);
document.getElementById('undo-button').addEventListener('click', handleUndo);
document.getElementById('speak-icon').addEventListener('click', () => speakName(nameDisplay.textContent));
document.body.addEventListener('touchstart', handleTouchStart, { passive: false });
document.body.addEventListener('touchmove', handleTouchMove, { passive: false });
document.body.addEventListener('touchend', handleTouchEnd, { passive: false });
toggleShortlistButton.addEventListener('click', toggleShortlist);

// Load names and initialize app
async function loadNames() {
    const response = await fetch('names.txt');
    const text = await response.text();
    names = text.split('\n').map(name => name.trim()).filter(name => name !== '');
    updateNameDisplay();
}

initializeVoices().then(loadNames);
