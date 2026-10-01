// Storage key
const STORAGE_KEY = 'students';

// State
let students = [];
let editingRollNumber = null;

// DOM elements
const studentForm = document.getElementById('studentForm');
const rollNumberInput = document.getElementById('rollNumber');
const studentNameInput = document.getElementById('studentName');
const classSelect = document.getElementById('classSelect');
const submitBtn = document.getElementById('submitBtn');
const cancelBtn = document.getElementById('cancelBtn');
const errorMessage = document.getElementById('errorMessage');
const searchInput = document.getElementById('searchInput');
const studentGrid = document.getElementById('studentGrid');
const noStudents = document.getElementById('noStudents');

// Initialize app
function init() {
    migrateStudentData();
    loadStudents();
    renderStudents();
    attachEventListeners();
}

// Migrate existing student data to add class field
function migrateStudentData() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return;
    
    try {
        let students = JSON.parse(stored);
        let needsSave = false;
        
        students = students.map(student => {
            if (!student.class) {
                needsSave = true;
                return { ...student, class: 'Class 1' };
            }
            return student;
        });
        
        if (needsSave) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(students));
        }
    } catch (e) {
        // Invalid data, skip migration
    }
}

// Load students from localStorage
function loadStudents() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
        try {
            students = JSON.parse(stored);
        } catch (e) {
            students = [];
        }
    }
}

// Save students to localStorage
function saveStudents() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(students));
}

// Attach event listeners
function attachEventListeners() {
    studentForm.addEventListener('submit', handleSubmit);
    cancelBtn.addEventListener('click', handleCancel);
    searchInput.addEventListener('input', handleSearch);
}

// Handle form submission
function handleSubmit(e) {
    e.preventDefault();
    
    const rollNumber = rollNumberInput.value.trim();
    const studentName = studentNameInput.value.trim();
    const studentClass = classSelect.value;
    
    // Clear previous error
    errorMessage.textContent = '';
    
    // Validate required fields
    if (!rollNumber || !studentName || !studentClass) {
        errorMessage.textContent = 'All fields are required.';
        return;
    }
    
    // Roll numbers are globally unique across all classes by design.
    // If per-class uniqueness is ever needed, add: && s.class === studentClass
    const duplicate = students.find(s => 
        s.rollNumber.toLowerCase() === rollNumber.toLowerCase() && 
        s.rollNumber !== editingRollNumber
    );
    
    if (duplicate) {
        errorMessage.textContent = 'Roll Number already exists. Please use a unique Roll Number.';
        return;
    }
    
    if (editingRollNumber !== null) {
        // Update existing student
        const index = students.findIndex(s => s.rollNumber === editingRollNumber);
        if (index !== -1) {
            students[index] = { rollNumber, name: studentName, class: studentClass };
        }
        editingRollNumber = null;
        submitBtn.textContent = 'Add Student';
        cancelBtn.classList.add('hidden');
    } else {
        // Add new student
        students.push({ rollNumber, name: studentName, class: studentClass });
    }
    
    saveStudents();
    renderStudents();
    clearForm();
}

// Handle cancel edit
function handleCancel() {
    editingRollNumber = null;
    submitBtn.textContent = 'Add Student';
    cancelBtn.classList.add('hidden');
    clearForm();
}

// Handle search/filter
function handleSearch(e) {
    const query = e.target.value.toLowerCase().trim();
    renderStudents(query);
}

// Clear form
function clearForm() {
    rollNumberInput.value = '';
    studentNameInput.value = '';
    classSelect.value = 'Class 1';
    errorMessage.textContent = '';
    rollNumberInput.focus();
}

// Render students
function renderStudents(searchQuery = '') {
    let filteredStudents = students;
    
    // Filter by search query
    if (searchQuery) {
        filteredStudents = students.filter(student => 
            student.rollNumber.toLowerCase().includes(searchQuery) ||
            student.name.toLowerCase().includes(searchQuery)
        );
    }
    
    // Sort by roll number
    filteredStudents.sort((a, b) => {
        return a.rollNumber.localeCompare(b.rollNumber, undefined, { numeric: true, sensitivity: 'base' });
    });
    
    // Show/hide no students message
    if (filteredStudents.length === 0) {
        studentGrid.innerHTML = '';
        noStudents.classList.remove('hidden');
        if (searchQuery) {
            noStudents.textContent = 'No students found matching your search.';
        } else {
            noStudents.textContent = 'No students registered yet.';
        }
        return;
    }
    
    noStudents.classList.add('hidden');
    
    // Render student cards
    studentGrid.innerHTML = filteredStudents.map(student => `
        <div class="student-card">
            <span class="student-name-top">${escapeHtml(student.name)}</span>
            <span class="student-class-badge">${escapeHtml(student.class || 'Class 1')}</span>
            <div class="student-card-body">
                <div class="student-roll-large">${escapeHtml(student.rollNumber)}</div>
            </div>
            <div class="student-card-actions">
                <button class="edit-btn" onclick="editStudent('${escapeHtml(student.rollNumber)}')">Edit</button>
                <button class="delete-btn" onclick="deleteStudent('${escapeHtml(student.rollNumber)}')">Delete</button>
            </div>
        </div>
    `).join('');
}

// Edit student
function editStudent(rollNumber) {
    const student = students.find(s => s.rollNumber === rollNumber);
    if (!student) return;
    
    editingRollNumber = rollNumber;
    rollNumberInput.value = student.rollNumber;
    studentNameInput.value = student.name;
    classSelect.value = student.class || 'Class 1';
    submitBtn.textContent = 'Update Student';
    cancelBtn.classList.remove('hidden');
    errorMessage.textContent = '';
    
    // Scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' });
    rollNumberInput.focus();
}

// Delete student
function deleteStudent(rollNumber) {
    const student = students.find(s => s.rollNumber === rollNumber);
    if (!student) return;
    
    const confirmed = confirm(`Are you sure you want to delete student ${student.rollNumber} (${student.name})?`);
    
    if (confirmed) {
        students = students.filter(s => s.rollNumber !== rollNumber);
        saveStudents();
        renderStudents();
        
        // Clear form if deleting the student being edited
        if (editingRollNumber === rollNumber) {
            handleCancel();
        }
    }
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', init);
