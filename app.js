const names = ["Emma", "Liam", "Olivia", "Noah", "Ava", "Ethan", "Sophia", "Mason", "Isabella", "Logan"];
let currentIndex = 0;
let approvedNames = JSON.parse(localStorage.getItem('approvedNames')) || [];
let rejectedNames = JSON.parse(localStorage.getItem('rejectedNames')) || [];
let lastEvaluatedName = null;
let lastEvaluation = null;
let startX = 0;
let isSwiping = false;

const nameDisplay = document.getElementById('name-display');
const progressDisplay = document.getElementById('progress-display');
const shortlistElement = document.getElementById('shortlist');
const showShortlistButton = document.getElementById('show-shortlist-button');
const nameCard = document.getElementById('name-card');

function updateProgressDisplay() {
    progressDisplay.textContent = `Approved: ${approvedNames.length}, Rejected: ${rejectedNames.length}, Total: ${names.length}`;
}

function showShortlist() {
    shortlistElement.innerHTML = "<ul>" + approvedNames.map(name => `<li>${name}</li>`).join('') + "</ul>";
    shortlistElement.style.display = 'block';
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
    } else {
        nameDisplay.textContent = "No more names!";
        document.querySelector('.buttons').style.display = 'none';
    }
    updateProgressDisplay();
}

function handleAccept() {
    const currentName = nameDisplay.textContent;
    if (currentName && !approvedNames.includes(currentName)) {
        approvedNames.push(currentName);
        lastEvaluatedName = currentName;
        lastEvaluation = 'approved';
        localStorage.setItem('approvedNames', JSON.stringify(approvedNames));
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
        lastEvaluatedName = null;
        lastEvaluation = null;
        document.querySelector('.buttons').style.display = 'flex';
        updateProgressDisplay();
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
    }

    isSwiping = false;
}

document.getElementById('accept-button').addEventListener('click', handleAccept);
document.getElementById('reject-button').addEventListener('click', handleReject);
document.getElementById('undo-button').addEventListener('click', handleUndo);
nameCard.addEventListener('touchstart', handleTouchStart);
nameCard.addEventListener('touchmove', handleTouchMove);
nameCard.addEventListener('touchend', handleTouchEnd);
showShortlistButton.addEventListener('click', showShortlist);

updateNameDisplay();