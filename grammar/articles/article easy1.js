// Correct answers for the 10 questions
const correctAnswers = ["a", "the", "an", "a", "an", "the", "a", "the", "an", "a"];

const blanks = document.querySelectorAll('.word');
const draggables = document.querySelectorAll('.draggable');
const scoreElement = document.getElementById('score');
let score = 0;

draggables.forEach(draggable => {
    draggable.addEventListener('dragstart', handleDragStart);
    draggable.addEventListener('dragend', handleDragEnd);
});

blanks.forEach((blank, index) => {
    blank.addEventListener('dragover', handleDragOver);
    blank.addEventListener('drop', (event) => handleDrop(event, index));
});

let draggedItem = null;

// Drag Start
function handleDragStart(event) {
    draggedItem = event.target;
    setTimeout(() => {
        event.target.style.display = "none";
    }, 0);
}

// Drag End
function handleDragEnd(event) {
    setTimeout(() => {
        draggedItem.style.display = "inline-block";
        draggedItem = null;
    }, 0);
}

// Allow drop
function handleDragOver(event) {
    event.preventDefault();
}

// Handle Drop
function handleDrop(event, index) {
    event.preventDefault();
    const blank = event.target;
    const draggedText = draggedItem.textContent;

    if (blank.textContent === "____") {
        blank.textContent = draggedText;

        if (draggedText === correctAnswers[index]) {
            blank.style.color = "green";
            correctSound.play(); // Play correct sound
            score++;
        } else {
            blank.style.color = "red";
            wrongSound.play(); // Play wrong sound
            showHint(blank.parentElement.dataset.hint, blank);
        }

        scoreElement.textContent = score;
    }
}

// Show Hint
function showHint(hintText, element) {
    const hint = document.createElement('div');
    hint.className = 'hint';
    hint.textContent = hintText;
    element.appendChild(hint);

    setTimeout(() => {
        element.removeChild(hint);
    }, 5000);
}

// Reset Quiz
function resetQuiz() {
    blanks.forEach(blank => {
        blank.textContent = "____";
        blank.style.color = "black";
    });

    draggables.forEach(draggable => {
        draggable.style.display = "inline-block";
    });

    score = 0;
    scoreElement.textContent = score;
}
// Load sound files
const correctSound = new Audio('../sounds/right.wav'); // Replace with actual path
const wrongSound = new Audio('../sounds/wrong.wav'); // Replace with actual path

