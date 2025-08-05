document.addEventListener('DOMContentLoaded', () => {
    const studentsList = document.getElementById('students-list');
    
    auth.onAuthStateChanged((user) => {
        if (!user) {
            window.location.href = 'index.html';
            return;
        }
        
        const urlParams = new URLSearchParams(window.location.search);
        const classId = urlParams.get('class');
        
        if (!classId) {
            window.location.href = 'index.html';
            return;
        }
        
        checkTeacherAccess(user.uid, classId)
            .then((hasAccess) => {
                if (!hasAccess) {
                    alert('You do not have access to this class');
                    firebaseHelpers.logout().then(() => window.location.href = 'index.html');
                } else {
                    setupPage(classId, user, studentsList);
                }
            });
    });
    
    // Add Student Functionality
    document.getElementById('add-student-btn').addEventListener('click', addNewStudent);
    
    // Logout button
    document.getElementById('logout-btn').addEventListener('click', () => {
        firebaseHelpers.logout().then(() => window.location.href = 'index.html');
    });
    
    // Comment modal buttons
    document.getElementById('cancel-comment').addEventListener('click', () => {
        document.getElementById('comment-modal').classList.add('hidden');
    });
});

function addNewStudent() {
    const studentName = document.getElementById('new-student-name').value.trim();
    const classId = new URLSearchParams(window.location.search).get('class');
    
    // Validation: Check for empty name
    if (!studentName) {
        showToast('Please enter a student name', 'error');
        return;
    }

    // Check for duplicate names
    database.ref(`classes/${classId}/students`).once('value')
        .then((snapshot) => {
            const students = snapshot.val() || {};
            const isDuplicate = Object.values(students).some(
                student => student.name.toLowerCase() === studentName.toLowerCase()
            );
            
            if (isDuplicate) {
                showToast('A student with this name already exists', 'error');
                return;
            }

            // Proceed with adding student if not duplicate
            const studentId = 'student_' + Date.now();
            const studentRef = database.ref(`classes/${classId}/students/${studentId}`);

            const studentData = {
                name: studentName,
                stars: 0,
                starHistory: {}
            };

            const updates = {};
            updates[`classes/${classId}/students/${studentId}`] = studentData;

            return database.ref().update(updates)
                .then(() => {
                    document.getElementById('new-student-name').value = '';
                    showToast('Student added successfully!');
                });
        })
        .catch((error) => {
            console.error("Error adding student:", error);
            showToast('Failed to add student. Please try again.', 'error');
        });
}
function checkTeacherAccess(teacherId, classId) {
    return database.ref(`teachers/${teacherId}/classes/${classId}`).once('value')
        .then((snapshot) => snapshot.exists());
}

function setupPage(classId, user, studentsList) {
    const classNameDisplay = document.getElementById('class-name');
    
    database.ref(`classes/${classId}/name`).once('value')
        .then((snapshot) => {
            const className = snapshot.val() || `Class ${classId.replace('class', '')}`;
            classNameDisplay.textContent = className;
        });
    
    database.ref(`classes/${classId}/students`).on('value', (snapshot) => {
        const students = snapshot.val() || {};
        studentsList.innerHTML = '';
        
        // 1. Convert to array with proper student names
        const studentsArray = Object.keys(students).map(studentId => {
            return {
                id: studentId,
                name: students[studentId].name || `Student ${studentId.replace('student_', '')}`,
                stars: students[studentId].stars || 0,
                starHistory: students[studentId].starHistory || {}
            };
        });
        
        // 2. Sort alphabetically by name (case insensitive)
        studentsArray.sort((a, b) => {
            const nameA = a.name.toLowerCase();
            const nameB = b.name.toLowerCase();
            return nameA.localeCompare(nameB);
        });
        
        // 3. Create rows in sorted order
        studentsArray.forEach(student => {
            createStudentRow(student, student.id, classId, user.uid, studentsList);
        });
    });
}

function createStudentRow(student, studentId, classId, teacherId, studentsList) {

// Add to createStudentRow function:
const historyBtn = document.createElement('button');
historyBtn.className = 'bg-blue-100 text-blue-600 p-2 rounded-full hover:bg-blue-200 transition ml-2';
historyBtn.innerHTML = `
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M3 3v18h18"></path>
    <path d="M18 17V9"></path>
    <path d="M13 17V5"></path>
    <path d="M8 17v-3"></path>
  </svg>
`;
historyBtn.addEventListener('click', () => {
  showStarHistory(studentId, classId, student.name);
});
 //****


    const row = document.createElement('div');
    row.className = 'bg-white rounded-lg shadow-md p-4 flex justify-between items-center mb-3';
    
    const studentInfo = document.createElement('div');
    studentInfo.className = 'flex items-center space-x-4';
    
    const name = document.createElement('span');
    name.className = 'text-lg font-medium';
    name.textContent = student.name || `Student ${studentId.replace('student', '')}`;
    
    const editBtn = document.createElement('button');
    editBtn.className = 'text-gray-400 hover:text-blue-500 transition';
    editBtn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
        </svg>
    `;
    editBtn.addEventListener('click', () => editStudentName(studentId, classId, student.name));
    
    studentInfo.appendChild(name);
    studentInfo.appendChild(editBtn);
    
    const starsDiv = document.createElement('div');
    starsDiv.className = 'flex items-center space-x-4';
    
    const starCount = document.createElement('span');
    starCount.className = 'text-xl font-bold text-yellow-500 min-w-[30px] text-center';
    starCount.textContent = student.stars || 0;
    starCount.id = `star-count-${studentId}`;
    
    const removeBtn = createActionButton('remove', studentId, classId, teacherId);
    const addBtn = createActionButton('add', studentId, classId, teacherId);
    //const historyBtn = createHistoryButton(studentId, classId, student.name);
    
    starsDiv.appendChild(removeBtn);
    starsDiv.appendChild(starCount);
    starsDiv.appendChild(addBtn);
    starsDiv.appendChild(historyBtn);
    
    row.appendChild(studentInfo);
    row.appendChild(starsDiv);
    
    studentsList.appendChild(row);
}

function createActionButton(type, studentId, classId, teacherId) {
    const btn = document.createElement('button');
    btn.className = type === 'add' 
        ? 'bg-green-100 text-green-600 p-2 rounded-full hover:bg-green-200 transition' 
        : 'bg-red-100 text-red-600 p-2 rounded-full hover:bg-red-200 transition';
    
    btn.innerHTML = type === 'add' ? `
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
    ` : `
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
    `;
    
    btn.addEventListener('click', () => {
        showCommentModal(studentId, classId, teacherId, type === 'add' ? 1 : -1);
    });
    
    return btn;
}

function createHistoryButton(studentId, classId, studentName) {
    const btn = document.createElement('button');
    btn.className = 'bg-blue-100 text-blue-600 p-2 rounded-full hover:bg-blue-200 transition ml-2';
    btn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 3v18h18"></path>
            <path d="M18 17V9"></path>
            <path d="M13 17V5"></path>
            <path d="M8 17v-3"></path>
        </svg>
    `;
    btn.addEventListener('click', () => {
        showStarHistory(studentId, classId, studentName);
    });
    return btn;
}

function editStudentName(studentId, classId, currentName) {
    const newName = prompt('Edit student name:', currentName);
    if (newName && newName.trim() !== '' && newName !== currentName) {
        database.ref(`classes/${classId}/students/${studentId}/name`).set(newName.trim())
            .then(() => showToast('Student name updated'))
            .catch((error) => {
                console.error("Error updating name:", error);
                showToast('Failed to update name', 'error');
            });
    }
}

function showStarHistory(studentId, classId, studentName) {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
    modal.innerHTML = `
        <div class="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
            <div class="flex justify-between items-center p-4 border-b sticky top-0 bg-white z-10">
                <h3 class="text-xl font-semibold">Star History for ${studentName}</h3>
                <button id="close-history" class="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100 transition">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>
            <div id="history-content" class="overflow-y-auto p-4 flex-1">
                <!-- History entries will be added here -->
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden'; // Prevent body scrolling
    
    // Load history
    database.ref(`classes/${classId}/students/${studentId}/starHistory`)
        .once('value')
        .then((snapshot) => {
            const history = snapshot.val() || {};
            const historyContent = modal.querySelector('#history-content');
            
            const historyArray = Object.entries(history)
                .map(([key, value]) => ({ ...value, id: key }))
                .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
            
            if (historyArray.length === 0) {
                historyContent.innerHTML = '<p class="text-gray-500 text-center py-4">No star history yet</p>';
                return;
            }
            
            // Clear previous content
            historyContent.innerHTML = '';
            
            historyArray.forEach((entry, index) => {
                const entryDiv = document.createElement('div');
                entryDiv.className = `p-3 ${index !== historyArray.length - 1 ? 'border-b border-gray-100' : ''}`;
                
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
                
                historyContent.appendChild(entryDiv);
            });
            
            // Scroll to top to show newest entries first
            historyContent.scrollTop = 0;
        });
    
    // Close button
    modal.querySelector('#close-history').addEventListener('click', () => {
        document.body.removeChild(modal);
        document.body.style.overflow = ''; // Restore body scrolling
    });
    
    // Close when clicking outside modal
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            document.body.removeChild(modal);
            document.body.style.overflow = ''; // Restore body scrolling
        }
    });
}


function showCommentModal(studentId, classId, teacherId, change) {
    const modal = document.getElementById('comment-modal');
    const commentText = document.getElementById('comment-text');
    const confirmBtn = document.getElementById('confirm-comment');
    
    commentText.value = '';
    
    confirmBtn.onclick = () => {
        const comment = commentText.value.trim();
        updateStars(studentId, classId, teacherId, change, comment);
        modal.classList.add('hidden');
    };
    
    modal.classList.remove('hidden');
}



// Updated updateStars function:
function updateStars(studentId, classId, teacherId, change, comment) {
  const updates = {};
  const timestamp = Date.now();
  
  // Get current star count
  database.ref(`classes/${classId}/students/${studentId}/stars`).once('value')
    .then((snapshot) => {
      const currentStars = snapshot.val() || 0;
      const newStars = currentStars + change;
      
      if (newStars < 0) {
        throw new Error("Cannot have negative stars");
      }
      
      // Prepare all updates
      updates[`classes/${classId}/students/${studentId}/stars`] = newStars;
      updates[`classes/${classId}/students/${studentId}/starHistory/${timestamp}`] = {
        change: change,
        teacher: teacherId,
        comment: comment || '',
        timestamp: timestamp
      };
      updates[`logs/${timestamp}`] = {
        action: change > 0 ? 'add_star' : 'remove_star',
        teacher: teacherId,
        student: studentId,
        class: classId,
        timestamp: timestamp,
        comment: comment || ''
      };
      
      // Execute all updates
      return database.ref().update(updates);
    })
    .then(() => {
      const starCountElement = document.getElementById(`star-count-${studentId}`);
      gsap.fromTo(starCountElement, 
        { scale: 1.5, color: change > 0 ? '#10B981' : '#EF4444' },
        { scale: 1, color: '#F59E0B', duration: 0.5 }
      );
      
      const sound = change > 0 
        ? document.getElementById('add-sound') 
        : document.getElementById('remove-sound');
      sound.currentTime = 0;
      sound.play();
      
      showToast(change > 0 ? 'Star added!' : 'Star removed');
    })
    .catch((error) => {
      console.error("Error updating stars:", error);
      showToast('Error updating stars', 'error');
    });
}



function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `fixed bottom-4 right-4 px-4 py-2 rounded-lg shadow-lg text-white ${
        type === 'success' ? 'bg-green-500' : 'bg-red-500'
    }`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('opacity-0', 'transition-opacity', 'duration-300');
        setTimeout(() => document.body.removeChild(toast), 300);
    }, 3000);
}