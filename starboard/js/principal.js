// Add these variables at the top of the file
const LOGS_PER_PAGE = 25;
let currentPage = 1;
let totalLogs = 0;
let allLogs = []; 

document.addEventListener('DOMContentLoaded', () => {
    // Check authentication and role
    auth.onAuthStateChanged((user) => {
        if (!user) {
            window.location.href = 'index.html';
            return;
        }
        
        firebaseHelpers.getUserRole(user.uid)
            .then((role) => {
                if (role !== 'principal') {
                    alert('You do not have access to this page');
                    firebaseHelpers.logout().then(() => window.location.href = 'index.html');
                } else {
                    setupPage(user);
                }
            });
    createPaginationControls();
    });

    // Logout button
    document.getElementById('logout-btn').addEventListener('click', () => {
        firebaseHelpers.logout().then(() => window.location.href = 'index.html');
    });
    
    // Date range picker
    $('#date-range').daterangepicker({
        opens: 'left',
        autoUpdateInput: false,
        locale: {
            cancelLabel: 'Clear'
        }
    });
    
    $('#date-range').on('apply.daterangepicker', function(ev, picker) {
        $(this).val(picker.startDate.format('MM/DD/YYYY') + ' - ' + picker.endDate.format('MM/DD/YYYY'));
    });
    
    $('#date-range').on('cancel.daterangepicker', function(ev, picker) {
        $(this).val('');
    });
    
    // Apply filters button
    document.getElementById('apply-filters').addEventListener('click', applyFilters);
    
    // Reset filters button
    document.getElementById('reset-filters').addEventListener('click', resetFilters);
});

function setupPage(user) {
    // Load teachers for filter
    loadTeachers();
    
    // Load classes for filter
    loadClasses();
    
    // Load initial logs
    loadLogs();
   // for class management
    initClassManagement();
}

function loadTeachers() {
    const teacherFilter = document.getElementById('teacher-filter');
    teacherFilter.innerHTML = '<option value="">All Teachers</option>';
    
    database.ref('teachers').once('value')
        .then((snapshot) => {
            const teachers = snapshot.val() || {};
            
            for (const teacherId in teachers) {
                const teacher = teachers[teacherId];
                const option = document.createElement('option');
                option.value = teacherId;
                option.textContent = teacher.name;
                teacherFilter.appendChild(option);
            }
        })
        .catch((error) => {
            console.error("Error loading teachers:", error);
        });
}

function loadClasses() {
    const classFilter = document.getElementById('class-filter');
    classFilter.innerHTML = '<option value="">All Classes</option>';
    
    database.ref('classes').once('value')
        .then((snapshot) => {
            const classes = snapshot.val() || {};
            
            for (const classId in classes) {
                const className = classes[classId].name || `Class ${classId.replace('class', '')}`;
                const option = document.createElement('option');
                option.value = classId;
                option.textContent = className;
                classFilter.appendChild(option);
            }
        })
        .catch((error) => {
            console.error("Error loading classes:", error);
        });
}

// Modify the loadLogs function
function loadLogs(filters = {}) {
    const logsTable = document.getElementById('logs-table');
    const statsDiv = document.getElementById('stats');
    
    logsTable.innerHTML = '<tr><td colspan="6" class="py-4 text-center">Loading...</td></tr>';
    statsDiv.textContent = 'Loading...';
    
    let logsRef = database.ref('logs').orderByChild('timestamp');
    
    logsRef.once('value')
        .then((snapshot) => {
            const logs = snapshot.val() || {};
            allLogs = Object.entries(logs).map(([key, value]) => ({
                id: key,
                ...value
            })).sort((a, b) => b.timestamp - a.timestamp);
            
            // Apply filters
            if (filters.teacher) {
                allLogs = allLogs.filter(log => log.teacher === filters.teacher);
            }
            
            if (filters.class) {
                allLogs = allLogs.filter(log => log.class === filters.class);
            }
            
            if (filters.startDate && filters.endDate) {
                allLogs = allLogs.filter(log => 
                    log.timestamp >= filters.startDate && 
                    log.timestamp <= filters.endDate
                );
            }
            
            totalLogs = allLogs.length;
            currentPage = 1; // Reset to first page when filters change
            renderLogsPage();
            updatePaginationControls();
        })
        .catch((error) => {
            console.error("Error loading logs:", error);
            logsTable.innerHTML = `
                <tr>
                    <td colspan="6" class="py-4 text-center text-red-500">Error loading logs: ${error.message}</td>
                </tr>
            `;
            statsDiv.textContent = 'Error loading stats';
        });
}

// Add these new functions
function renderLogsPage() {
    const logsTable = document.getElementById('logs-table');
    const statsDiv = document.getElementById('stats');
    
    logsTable.innerHTML = '';
    
    const startIndex = (currentPage - 1) * LOGS_PER_PAGE;
    const endIndex = startIndex + LOGS_PER_PAGE;
    const logsToShow = allLogs.slice(startIndex, endIndex);
    
    if (logsToShow.length === 0) {
        logsTable.innerHTML = `
            <tr>
                <td colspan="6" class="py-4 text-center text-gray-500">No matching logs found</td>
            </tr>
        `;
        statsDiv.textContent = `Total: 0 | Stars Added: 0 | Stars Removed: 0`;
        return;
    }
    
    let starsAdded = 0;
    let starsRemoved = 0;
    
    logsToShow.forEach((log) => {
        if (log.action === 'add_star') starsAdded++;
        if (log.action === 'remove_star') starsRemoved++;
        createLogRow(log);
    });
    
    statsDiv.textContent = `Total: ${totalLogs} | Stars Added: ${starsAdded} | Stars Removed: ${starsRemoved} | Page ${currentPage} of ${Math.ceil(totalLogs / LOGS_PER_PAGE)}`;
}

function updatePaginationControls() {
    const paginationDiv = document.getElementById('pagination-controls') || createPaginationControls();
    const totalPages = Math.ceil(totalLogs / LOGS_PER_PAGE);
    
    document.getElementById('prev-page').disabled = currentPage <= 1;
    document.getElementById('next-page').disabled = currentPage >= totalPages;
    document.getElementById('page-info').textContent = `Page ${currentPage} of ${totalPages}`;
}

function createPaginationControls() {
    const controlsDiv = document.createElement('div');
    controlsDiv.id = 'pagination-controls';
    controlsDiv.className = 'flex justify-center items-center mt-4 space-x-4';
    
    controlsDiv.innerHTML = `
        <button id="prev-page" class="px-4 py-2 bg-gray-200 rounded-lg disabled:opacity-50">Previous</button>
        <span id="page-info" class="text-gray-700">Page 1 of 1</span>
        <button id="next-page" class="px-4 py-2 bg-gray-200 rounded-lg disabled:opacity-50">Next</button>
    `;
    
    document.getElementById('logs-table').parentElement.appendChild(controlsDiv);
    
    document.getElementById('prev-page').addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            renderLogsPage();
            updatePaginationControls();
        }
    });
    
    document.getElementById('next-page').addEventListener('click', () => {
        if (currentPage < Math.ceil(totalLogs / LOGS_PER_PAGE)) {
            currentPage++;
            renderLogsPage();
            updatePaginationControls();
        }
    });
    
    return controlsDiv;
}

function createLogRow(log) {
    const row = document.createElement('tr');
    row.className = 'hover:bg-gray-50';
    
    // Date cell
    const dateCell = document.createElement('td');
    dateCell.className = 'py-2 px-4 border text-sm';
    dateCell.textContent = log.timestamp ? new Date(log.timestamp).toLocaleString() : 'Unknown date';
    
    // Teacher cell
    const teacherCell = document.createElement('td');
    teacherCell.className = 'py-2 px-4 border text-sm';
    teacherCell.textContent = 'Loading...';
    
    // Get teacher name
    database.ref(`teachers/${log.teacher}/name`).once('value')
        .then((snapshot) => {
            teacherCell.textContent = snapshot.val() || `Teacher ${log.teacher}`;
        })
        .catch(() => {
            teacherCell.textContent = `Teacher ${log.teacher}`;
        });
    
    // Action cell
    const actionCell = document.createElement('td');
    actionCell.className = 'py-2 px-4 border text-sm';
    
    const actionBadge = document.createElement('span');
    actionBadge.className = log.action === 'add_star' 
        ? 'bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs'
        : 'bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs';
    actionBadge.textContent = log.action === 'add_star' ? 'Star Added' : 'Star Removed';
    
    actionCell.appendChild(actionBadge);
    
    // Student cell
    const studentCell = document.createElement('td');
    studentCell.className = 'py-2 px-4 border text-sm';
    studentCell.textContent = 'Loading...';
    
    // Get student name
    if (log.class && log.student) {
        database.ref(`classes/${log.class}/students/${log.student}/name`).once('value')
            .then((snapshot) => {
                studentCell.textContent = snapshot.val() || `Student ${log.student}`;
            })
            .catch(() => {
                studentCell.textContent = `Student ${log.student}`;
            });
    } else {
        studentCell.textContent = 'Unknown student';
    }
    
    // Class cell
    const classCell = document.createElement('td');
    classCell.className = 'py-2 px-4 border text-sm';
    classCell.textContent = 'Loading...';
    
    // Get class name
    if (log.class) {
        database.ref(`classes/${log.class}/name`).once('value')
            .then((snapshot) => {
                classCell.textContent = snapshot.val() || `Class ${log.class.replace('class', '')}`;
            })
            .catch(() => {
                classCell.textContent = `Class ${log.class.replace('class', '')}`;
            });
    } else {
        classCell.textContent = 'Unknown class';
    }
    
    // Comment cell
    const commentCell = document.createElement('td');
    commentCell.className = 'py-2 px-4 border text-sm';
    commentCell.textContent = log.comment || '-';
    
    // Append all cells to the row
    row.appendChild(dateCell);
    row.appendChild(teacherCell);
    row.appendChild(actionCell);
    row.appendChild(studentCell);
    row.appendChild(classCell);
    row.appendChild(commentCell);
    
    // Append row to table
    document.getElementById('logs-table').appendChild(row);
}

function applyFilters() {
    const teacherFilter = document.getElementById('teacher-filter').value;
    const classFilter = document.getElementById('class-filter').value;
    const dateRange = document.getElementById('date-range').value;
    
    const filters = {};
    
    if (teacherFilter) filters.teacher = teacherFilter;
    if (classFilter) filters.class = classFilter;
    
    if (dateRange) {
        const dates = dateRange.split(' - ');
        filters.startDate = new Date(dates[0]).getTime();
        filters.endDate = new Date(dates[1]).getTime() + 86400000; // Add one day to include the end date
    }
    
    loadLogs(filters);
}

function resetFilters() {
    document.getElementById('teacher-filter').value = '';
    document.getElementById('class-filter').value = '';
    document.getElementById('date-range').value = '';
    loadLogs();
}


// Initialize class management
function initClassManagement() {
  // Load dropdowns
  refreshClassDropdown();
  refreshTeacherDropdown();

  // Add class button
  document.getElementById('add-class-btn').addEventListener('click', addNewClass);
  
  // Assign teacher button
  document.getElementById('assign-teacher-btn').addEventListener('click', assignTeacherToClass);
}

// Toast notification function
function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `fixed bottom-4 right-4 px-4 py-2 rounded-lg shadow-lg text-white ${
    type === 'success' ? 'bg-green-500' : 'bg-red-500'
  }`;
  toast.textContent = message;
  document.body.appendChild(toast);

  // Auto-remove after 3 seconds
  setTimeout(() => {
    toast.classList.add('opacity-0', 'transition-opacity', 'duration-300');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}
// Add new class
// Updated addNewClass function
function addNewClass() {
  const className = document.getElementById('new-class-name').value.trim();
  if (!className) {
    showToast('Please enter a class name', 'error');
    return;
  }

  const classId = `class_${Date.now()}`;
  
  database.ref(`classes/${classId}`).set({
    name: className,
    students: {}
  })
  .then(() => {
    showToast(`Class "${className}" created successfully!`);
    document.getElementById('new-class-name').value = '';
    refreshClassDropdown();
    loadClasses();
  })
  .catch(error => {
    console.error("Error adding class:", error);
    showToast('Failed to create class: ' + error.message, 'error');
  });
}

// Updated assignTeacherToClass function
function assignTeacherToClass() {
  const classId = document.getElementById('assign-class-select').value;
  const teacherId = document.getElementById('assign-teacher-select').value;

  if (!classId || !teacherId) {
    showToast('Please select both a class and teacher', 'error');
    return;
  }

  const updates = {};
  updates[`classes/${classId}/teachers/${teacherId}`] = true;
  updates[`teachers/${teacherId}/classes/${classId}`] = true;

  database.ref().update(updates)
    .then(() => {
      const className = document.getElementById('assign-class-select').selectedOptions[0].text;
      const teacherName = document.getElementById('assign-teacher-select').selectedOptions[0].text;
      showToast(`Assigned ${teacherName} to ${className}`);
    })
    .catch(error => {
      console.error("Assignment failed:", error);
      showToast('Assignment failed: ' + error.message, 'error');
    });
}

// Refresh dropdowns
function refreshClassDropdown() {
  const dropdown = document.getElementById('assign-class-select');
  dropdown.innerHTML = '<option value="">Select Class</option>';

  database.ref('classes').once('value')
    .then(snapshot => {
      snapshot.forEach(classSnap => {
        const option = document.createElement('option');
        option.value = classSnap.key;
        option.textContent = classSnap.val().name || `Class ${classSnap.key.replace('class_', '')}`;
        dropdown.appendChild(option);
      });
    });
}

function refreshTeacherDropdown() {
  const dropdown = document.getElementById('assign-teacher-select');
  dropdown.innerHTML = '<option value="">Select Teacher</option>';

  database.ref('teachers').once('value')
    .then(snapshot => {
      snapshot.forEach(teacherSnap => {
        const option = document.createElement('option');
        option.value = teacherSnap.key;
        option.textContent = teacherSnap.val().name;
        dropdown.appendChild(option);
      });
    });
}