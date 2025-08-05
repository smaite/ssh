//Add this theme map at the top
const CLASS_THEMES = {
  'class1': {
    primary: '#7c3aed',
    primaryLight: '#8b5cf6',
    primaryDark: '#6d28d9',
    secondary: '#f59e0b'
  },
  'class2': {
    primary: '#3b82f6',
    primaryLight: '#60a5fa',
    primaryDark: '#2563eb',
    secondary: '#10b981'
  },
  'class_1754142004005': {
    primary: '#10b981',
    primaryLight: '#34d399',
    primaryDark: '#059669',
    secondary: '#3b82f6'
  }
  // Add other classes as needed
};
document.addEventListener('DOMContentLoaded', () => {
    const database = window.database || firebase.database();
    const urlParams = new URLSearchParams(window.location.search);
    const classId = urlParams.get('class');
    
    if (!classId) {
        window.location.href = 'index.html';
        return;
    }

    database.ref('publicClasses/' + classId).once('value')
        .then((publicSnapshot) => {
            if (publicSnapshot.val() !== true) {
                throw new Error('CLASS_PRIVATE');
            }
            return database.ref(`classes/${classId}/name`).once('value');
        })
       // Then modify where you set up the page (in the then() after getting class data)
// Modify where you load the class
// Modify where you load the class
.then((classSnapshot) => {
    const className = classSnapshot.val() || `Class ${classId.replace('class', '')}`;
    document.getElementById('class-name').textContent = className;
    
    // Get theme or use default (class1)
    const theme = CLASS_THEMES[classId] || CLASS_THEMES['class1'];
    
    // Remove any existing theme classes
    document.body.classList.remove('theme-active');
    
    // Apply new theme directly to root element
    document.documentElement.style.setProperty('--primary', theme.primary);
    document.documentElement.style.setProperty('--primary-light', theme.primaryLight);
    document.documentElement.style.setProperty('--primary-dark', theme.primaryDark);
    document.documentElement.style.setProperty('--secondary', theme.secondary);
    
    // Add theme-active class to trigger updates
    document.body.classList.add('theme-active');
    
    return database.ref(`classes/${classId}/students`).once('value');
})
        .then((studentsSnapshot) => {
            const students = studentsSnapshot.val() || {};
            const container = document.getElementById('stars-container');
            container.innerHTML = '';
            
            // Convert to array and sort by star count (descending)
            const studentsArray = Object.entries(students)
                .map(([id, student]) => ({
                    id,
                    name: student.name,
                    stars: student.stars || 0,
                    starHistory: student.starHistory || {}
                }))
                .sort((a, b) => b.stars - a.stars); // Sort by stars descending

            // Create student cards in order (keeping your original card design)
           // Modify the student card creation part
    studentsArray.forEach((student) => {
        const starCount = Math.min(student.stars, 10);
        const starIcons = [];
        
        for (let i = 0; i < 10; i++) {
            if (i < starCount) {
                starIcons.push(`
                    <svg class="h-8 w-8 text-yellow-500 star-icon animate-pulse" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/>
                    </svg>
                `);
            } else {
                starIcons.push(`
                    <svg class="h-8 w-8 text-gray-200 star-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/>
                    </svg>
                `);
            }
        }
        
        const card = document.createElement('div');
        card.className = 'bg-white rounded-xl shadow-md p-6 mb-4 star-card cursor-pointer transition-all hover:shadow-lg';
        card.innerHTML = `
            <h3 class="text-xl font-semibold text-center text-gray-800 mb-4">${student.name}</h3>
            <div class="flex justify-center gap-1">
                ${starIcons.join('')}
            </div>
            ${student.stars > 10 ? 
                `<p class="text-center text-sm text-gray-500 mt-2">+${student.stars - 10} more</p>` : 
                ''}
        `;
        
        // Add click handler to show star history
        card.addEventListener('click', () => {
            showStarHistoryModal(student, classId);
        });
        
        // Add GSAP animation
        gsap.from(card, {
            opacity: 0,
            y: 20,
            duration: 0.5,
            delay: studentsArray.indexOf(student) * 0.1
        });
        
        container.appendChild(card);
    });
});

// Add this new function
function showStarHistoryModal(student, classId) {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
    modal.innerHTML = `
        <div class="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
            <div class="flex justify-between items-center p-4 border-b sticky top-0 bg-white z-10">
                <h3 class="text-xl font-semibold">Star History for ${student.name}</h3>
                <button id="close-history" class="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100 transition">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>
            <div id="history-content" class="overflow-y-auto p-4 flex-1">
                <div class="flex justify-between items-center mb-4">
                    <div class="text-lg font-medium">Total Stars: <span class="text-yellow-500">${student.stars}</span></div>
                </div>
                <div id="history-entries"></div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';
    
    // Load history
    const historyEntries = Object.entries(student.starHistory || {})
        .map(([key, value]) => ({ ...value, id: key }))
        .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    
    const historyContent = modal.querySelector('#history-entries');
    
    if (historyEntries.length === 0) {
        historyContent.innerHTML = '<p class="text-gray-500 text-center py-4">No star history yet</p>';
    } else {
        historyEntries.forEach((entry, index) => {
            const entryDiv = document.createElement('div');
            entryDiv.className = `p-3 ${index !== historyEntries.length - 1 ? 'border-b border-gray-100' : ''}`;
            
            const changeText = entry.change > 0 
                ? `<span class="text-green-600 font-medium">+${entry.change} star</span>` 
                : `<span class="text-red-600 font-medium">${entry.change} star</span>`;
            
            const date = entry.timestamp 
                ? new Date(entry.timestamp).toLocaleString() 
                : 'Unknown date';
            
            entryDiv.innerHTML = `
                <div class="flex justify-between items-start">
                    <div class="flex-1 min-w-0">
                        ${changeText}
                        ${entry.comment ? `<p class="mt-1 text-gray-700 break-words">${entry.comment}</p>` : ''}
                    </div>
                    <span class="text-gray-500 text-sm whitespace-nowrap ml-4">${date}</span>
                </div>
            `;
            
            // Add animation
            gsap.from(entryDiv, {
                opacity: 0,
                y: 10,
                duration: 0.3,
                delay: index * 0.05
            });
            
            historyContent.appendChild(entryDiv);
        });
    }
    
    // Close button
    modal.querySelector('#close-history').addEventListener('click', () => {
        document.body.removeChild(modal);
        document.body.style.overflow = '';
    });
    
    // Close when clicking outside modal
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            document.body.removeChild(modal);
            document.body.style.overflow = '';
        }
    });
}
});
/*                
                // Your original card HTML (unchanged except for the star count)
                container.innerHTML += `
                    <div class="bg-white rounded-xl shadow-md p-6 mb-4 star-card">
                        <h3 class="text-xl font-semibold text-center text-gray-800 mb-4">${student.name}</h3>
                        <div class="flex justify-center gap-1">
                            ${starIcons.join('')}
                        </div>
                        ${student.stars > 10 ? 
                            `<p class="text-center text-sm text-gray-500 mt-2">+${student.stars - 10} more</p>` : 
                            ''}
                    </div>
                `;
            });
        })

        .catch((error) => {
            console.error("Error:", error);
            document.getElementById('stars-container').innerHTML = `
                <div class="bg-red-50 border border-red-200 p-4 rounded-lg">
                    <p class="text-red-600">${error.message === 'CLASS_PRIVATE' 
                        ? 'This class is not available for public viewing.' 
                        : 'Error loading data: ' + error.message}</p>
                </div>
            `;
        });
});
*/