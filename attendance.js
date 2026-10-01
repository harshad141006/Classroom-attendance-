// Storage keys
const STUDENTS_KEY = 'students';
const ATTENDANCE_PREFIX = 'attendance_';

// State
let students = [];
let currentDate = '';
let currentClass = 'Class 1';
let currentAttendance = {};
let selectedStudent = null;

// DOM elements
const classSelect = document.getElementById('classSelect');
const attendanceDateInput = document.getElementById('attendanceDate');
const attendanceGrid = document.getElementById('attendanceGrid');
const noStudents = document.getElementById('noStudents');
const statusModal = document.getElementById('statusModal');
const modalRollNumber = document.getElementById('modalRollNumber');
const modalStudentName = document.getElementById('modalStudentName');
const statusButtons = document.querySelectorAll('.status-btn');

// Summary elements
const totalCount = document.getElementById('totalCount');
const presentCount = document.getElementById('presentCount');
const absentCount = document.getElementById('absentCount');
const internalOdCount = document.getElementById('internalOdCount');
const externalOdCount = document.getElementById('externalOdCount');

// Initialize app
function init() {
    migrateData();
    loadStudents();
    setTodayDate();
    attachEventListeners();
    
    const classFilteredStudents = getClassFilteredStudents();
    if (classFilteredStudents.length === 0) {
        showNoStudents();
    } else {
        loadAttendance();
        renderAttendance();
        updateSummary();
        updateStatusLists();
    }
}

// Migrate existing data to support class management
function migrateData() {
    // 1. Migrate student data to add class field
    const studentsStored = localStorage.getItem(STUDENTS_KEY);
    if (studentsStored) {
        try {
            let studentsList = JSON.parse(studentsStored);
            let needsSave = false;
            
            studentsList = studentsList.map(student => {
                if (!student.class) {
                    needsSave = true;
                    return { ...student, class: 'Class 1' };
                }
                return student;
            });
            
            if (needsSave) {
                localStorage.setItem(STUDENTS_KEY, JSON.stringify(studentsList));
            }
        } catch (e) {
            // Invalid data, skip migration
        }
    }
    
    // 2. Migrate attendance data from old format to class-specific format
    const allKeys = Object.keys(localStorage);
    const oldAttendancePattern = /^attendance_(\d{4}-\d{2}-\d{2})$/;
    
    allKeys.forEach(key => {
        const match = key.match(oldAttendancePattern);
        if (match) {
            const date = match[1];
            const newKey = `attendance_${date}_Class-1`;
            const value = localStorage.getItem(key);
            
            // Only migrate if new key doesn't exist
            if (!localStorage.getItem(newKey)) {
                localStorage.setItem(newKey, value);
            }
            
            // Remove old key
            localStorage.removeItem(key);
        }
    });
}

// Load students from localStorage
function loadStudents() {
    const stored = localStorage.getItem(STUDENTS_KEY);
    if (stored) {
        try {
            students = JSON.parse(stored);
        } catch (e) {
            students = [];
        }
    }
}

// Get students filtered by current class
function getClassFilteredStudents() {
    return students.filter(student => student.class === currentClass);
}

// Set today's date as default
function setTodayDate() {
    const today = new Date();
    const formattedDate = today.toISOString().split('T')[0];
    attendanceDateInput.value = formattedDate;
    currentDate = formattedDate;
}

// Attach event listeners
function attachEventListeners() {
    classSelect.addEventListener('change', handleClassChange);
    attendanceDateInput.addEventListener('change', handleDateChange);
    
    // Status button clicks
    statusButtons.forEach(btn => {
        btn.addEventListener('click', handleStatusSelect);
    });
    
    // Modal backdrop click to close
    statusModal.addEventListener('click', (e) => {
        if (e.target === statusModal) {
            closeModal();
        }
    });
}

// Handle class change
function handleClassChange(e) {
    currentClass = e.target.value;
    const classFilteredStudents = getClassFilteredStudents();
    
    if (classFilteredStudents.length === 0) {
        showNoStudents();
    } else {
        loadAttendance();
        renderAttendance();
        updateSummary();
        updateStatusLists();
    }
}

// Handle date change
function handleDateChange(e) {
    currentDate = e.target.value;
    loadAttendance();
    renderAttendance();
    updateSummary();
    updateStatusLists();
}

// Load attendance for current date and class
function loadAttendance() {
    const storageKey = ATTENDANCE_PREFIX + currentDate + '_' + currentClass.replace(' ', '-');
    const stored = localStorage.getItem(storageKey);
    
    if (stored) {
        try {
            const attendanceArray = JSON.parse(stored);
            // Convert array to object for easy lookup
            currentAttendance = {};
            attendanceArray.forEach(record => {
                currentAttendance[record.rollNumber] = record.status;
            });
        } catch (e) {
            initializeAttendance();
        }
    } else {
        initializeAttendance();
    }
}

// Initialize attendance with all students PRESENT
function initializeAttendance() {
    currentAttendance = {};
    const classFilteredStudents = getClassFilteredStudents();
    classFilteredStudents.forEach(student => {
        currentAttendance[student.rollNumber] = 'PRESENT';
    });
    saveAttendance();
}

// Save attendance to localStorage
function saveAttendance() {
    const storageKey = ATTENDANCE_PREFIX + currentDate + '_' + currentClass.replace(' ', '-');
    // Convert object to array for storage
    const attendanceArray = Object.keys(currentAttendance).map(rollNumber => ({
        rollNumber,
        status: currentAttendance[rollNumber]
    }));
    localStorage.setItem(storageKey, JSON.stringify(attendanceArray));
}

// Render attendance cards
function renderAttendance() {
    const classFilteredStudents = getClassFilteredStudents();
    
    if (classFilteredStudents.length === 0) {
        showNoStudents();
        return;
    }
    
    noStudents.classList.add('hidden');
    
    attendanceGrid.innerHTML = classFilteredStudents.map(student => {
        const status = currentAttendance[student.rollNumber] || 'PRESENT';
        const statusClass = status.replace(' ', '-');
        
        return `
            <div class="attendance-card" onclick="openStatusModal('${escapeHtml(student.rollNumber)}')">
                <div class="attendance-card-header">
                    <span class="student-roll-small">${escapeHtml(student.rollNumber)}</span>
                    <span class="student-name-top">${escapeHtml(student.name)}</span>
                </div>
                <div class="attendance-card-body">
                    <div class="student-roll-large">${escapeHtml(student.rollNumber)}</div>
                    <div class="status-badge ${statusClass}">${status}</div>
                </div>
            </div>
        `;
    }).join('');
}

// Show no students message
function showNoStudents() {
    attendanceGrid.innerHTML = '';
    noStudents.classList.remove('hidden');
    
    // Reset summary
    totalCount.textContent = '0';
    presentCount.textContent = '0';
    absentCount.textContent = '0';
    internalOdCount.textContent = '0';
    externalOdCount.textContent = '0';
    
    // Clear status lists
    updateStatusLists();
}

// Open status selection modal
function openStatusModal(rollNumber) {
    const student = students.find(s => s.rollNumber === rollNumber);
    if (!student) return;
    
    selectedStudent = rollNumber;
    modalRollNumber.textContent = student.rollNumber;
    modalStudentName.textContent = student.name;
    statusModal.classList.remove('hidden');
}

// Close modal
function closeModal() {
    statusModal.classList.add('hidden');
    selectedStudent = null;
}

// Handle status selection
function handleStatusSelect(e) {
    const status = e.target.dataset.status;
    
    if (selectedStudent && status) {
        currentAttendance[selectedStudent] = status;
        saveAttendance();
        renderAttendance();
        updateSummary();
        updateStatusLists();
        closeModal();
    }
}

// Update summary counts
function updateSummary() {
    const classFilteredStudents = getClassFilteredStudents();
    
    if (classFilteredStudents.length === 0) {
        totalCount.textContent = '0';
        presentCount.textContent = '0';
        absentCount.textContent = '0';
        internalOdCount.textContent = '0';
        externalOdCount.textContent = '0';
        
        // Update banner
        const bannerDateEl = document.getElementById('bannerDate');
        const bannerClassEl = document.getElementById('bannerClass');
        const bannerTotalEl = document.getElementById('bannerTotal');
        const bannerPresentEl = document.getElementById('bannerPresent');
        const bannerAbsentEl = document.getElementById('bannerAbsent');
        const bannerInternalOdEl = document.getElementById('bannerInternalOd');
        const bannerExternalOdEl = document.getElementById('bannerExternalOd');

        if (bannerDateEl) bannerDateEl.textContent = currentDate || '--';
        if (bannerClassEl) bannerClassEl.textContent = currentClass.replace('Class ', '');
        if (bannerTotalEl) bannerTotalEl.textContent = '0';
        if (bannerPresentEl) bannerPresentEl.textContent = '0';
        if (bannerAbsentEl) bannerAbsentEl.textContent = '0';
        if (bannerInternalOdEl) bannerInternalOdEl.textContent = '0';
        if (bannerExternalOdEl) bannerExternalOdEl.textContent = '0';
        return;
    }
    
    let present = 0;
    let absent = 0;
    let internalOd = 0;
    let externalOd = 0;
    
    classFilteredStudents.forEach(student => {
        const status = currentAttendance[student.rollNumber] || 'PRESENT';
        
        switch (status) {
            case 'PRESENT':
                present++;
                break;
            case 'ABSENT':
                absent++;
                break;
            case 'INTERNAL OD':
                internalOd++;
                break;
            case 'EXTERNAL OD':
                externalOd++;
                break;
        }
    });
    
    totalCount.textContent = classFilteredStudents.length;
    presentCount.textContent = present;
    absentCount.textContent = absent;
    internalOdCount.textContent = internalOd;
    externalOdCount.textContent = externalOd;
    
    // Also update the banner
    const bannerDateEl = document.getElementById('bannerDate');
    const bannerClassEl = document.getElementById('bannerClass');
    const bannerTotalEl = document.getElementById('bannerTotal');
    const bannerPresentEl = document.getElementById('bannerPresent');
    const bannerAbsentEl = document.getElementById('bannerAbsent');
    const bannerInternalOdEl = document.getElementById('bannerInternalOd');
    const bannerExternalOdEl = document.getElementById('bannerExternalOd');

    if (bannerDateEl) bannerDateEl.textContent = currentDate || '--';
    if (bannerClassEl) bannerClassEl.textContent = currentClass.replace('Class ', '');
    if (bannerTotalEl) bannerTotalEl.textContent = classFilteredStudents.length;
    if (bannerPresentEl) bannerPresentEl.textContent = present;
    if (bannerAbsentEl) bannerAbsentEl.textContent = absent;
    if (bannerInternalOdEl) bannerInternalOdEl.textContent = internalOd;
    if (bannerExternalOdEl) bannerExternalOdEl.textContent = externalOd;
}

// Update status lists for ABSENT, INTERNAL OD, EXTERNAL OD
function updateStatusLists() {
    const absenteesList = document.getElementById('absenteesList');
    const internalOdList = document.getElementById('internalOdList');
    const externalOdList = document.getElementById('externalOdList');

    if (!absenteesList || !internalOdList || !externalOdList) return;

    const classFilteredStudents = getClassFilteredStudents();
    const absentees = [];
    const internalOds = [];
    const externalOds = [];

    classFilteredStudents.forEach(student => {
        const status = currentAttendance[student.rollNumber] || 'PRESENT';
        if (status === 'ABSENT') absentees.push(student);
        else if (status === 'INTERNAL OD') internalOds.push(student);
        else if (status === 'EXTERNAL OD') externalOds.push(student);
    });

    // Sort each list by roll number
    const sortByRoll = (a, b) => a.rollNumber.localeCompare(b.rollNumber, undefined, { numeric: true, sensitivity: 'base' });
    absentees.sort(sortByRoll);
    internalOds.sort(sortByRoll);
    externalOds.sort(sortByRoll);

    function renderList(ul, arr) {
        if (arr.length === 0) {
            ul.innerHTML = '<li class="status-list-none">None</li>';
        } else {
            ul.innerHTML = arr.map(s =>
                `<li class="status-list-item">&#8226; ${escapeHtml(s.rollNumber)} - ${escapeHtml(s.name)}</li>`
            ).join('');
        }
    }

    renderList(absenteesList, absentees);
    renderList(internalOdList, internalOds);
    renderList(externalOdList, externalOds);
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', init);
