 let score = 0;

        function resetQuiz() {
            score = 0;
            document.getElementById('score').textContent = `Score: ${score}`;
            document.querySelectorAll('#quiz span').forEach(span => {
                span.querySelectorAll('button').forEach(button => {
                    button.disabled = false;
                    button.classList.remove('correct', 'incorrect');
                });
            });
        }

        document.querySelectorAll('#quiz span').forEach(span => {
            const answer = span.dataset.answer;
            span.querySelectorAll('button').forEach(button => {
                button.addEventListener('click', () => {
                    if (button.textContent.trim() === answer) {
                        button.classList.add('correct');
                        score++;
                    } else {
                        button.classList.add('incorrect');
                    }
                    span.querySelectorAll('button').forEach(btn => btn.disabled = true);
                    document.getElementById('score').textContent = `Score: ${score}`;
                });
            });
        });

        document.getElementById('reset').addEventListener('click', resetQuiz);