// Correct answers for the questions
const correctAnswers = [
    "an", "the", "a", "none", "a", 
    "a", "the", "a", "none", "the"
];

const answerBoxes = document.querySelectorAll('.answer-box');
const scoreElement = document.getElementById('score');

// Check Answers
function checkAnswers() {
    let score = 0;

    answerBoxes.forEach((box, index) => {
        const userAnswer = box.value.trim().toLowerCase();
        if (userAnswer === correctAnswers[index]) {
            box.style.color = "green"; // Correct answer
            score++;
        } else {
            box.style.color = "red"; // Incorrect answer
        }
    });

    scoreElement.textContent = score;
}

// Reset the Quiz
function resetQuiz() {
    answerBoxes.forEach((box) => {
        box.value = ""; // Clear the textbox
        box.style.color = "black"; // Reset the text color
    });

    scoreElement.textContent = 0; // Reset the score
}
