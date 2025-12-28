import './style.css';

// State Management
let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
let currentFilter = 'all';

// DOM Elements
const taskInput = document.getElementById('taskInput');
const dateInput = document.getElementById('dateInput'); // New
const addBtn = document.getElementById('addBtn');
const taskList = document.getElementById('taskList');
const filterBtns = document.querySelectorAll('.filter-btn'); // New
const clearBtn = document.getElementById('clearBtn'); // New

// Functions
const saveTasks = () => {
  localStorage.setItem('tasks', JSON.stringify(tasks));
};

const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

const createTaskElement = (task) => {
  const li = document.createElement('li');
  li.className = `task-item ${task.completed ? 'completed' : ''}`;
  li.dataset.id = task.id;
  li.draggable = true; // Enable drag

  li.innerHTML = `
    <div class="task-content">
      <input type="checkbox" class="checkbox" ${task.completed ? 'checked' : ''}>
      <div class="task-details">
         <span class="task-text">${task.text}</span>
         ${task.dueDate ? `<span class="task-date">📅 ${formatDate(task.dueDate)}</span>` : ''}
      </div>
    </div>
    <button class="delete-btn">Delete</button>
  `;

  // Event Listeners
  const checkbox = li.querySelector('.checkbox');
  checkbox.addEventListener('change', () => toggleTask(task.id));

  const deleteBtn = li.querySelector('.delete-btn');
  deleteBtn.addEventListener('click', () => deleteTask(task.id));

  // Edit Feature
  const taskText = li.querySelector('.task-text');
  taskText.addEventListener('dblclick', () => enableEditMode(task, taskText));

  // Drag Events
  li.addEventListener('dragstart', () => li.classList.add('dragging'));
  li.addEventListener('dragend', () => {
    li.classList.remove('dragging');
    saveNewOrder(); // Save new order after drag ends
  });

  return li;
};

const enableEditMode = (task, element) => {
  const input = document.createElement('input');
  input.type = 'text';
  input.value = task.text;
  input.className = 'edit-input';
  
  const saveEdit = () => {
    const newText = input.value.trim();
    if (newText) {
      updateTaskText(task.id, newText);
    } else {
      renderTasks(); // Revert if empty
    }
  };

  input.addEventListener('blur', saveEdit);
  input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') saveEdit();
  });

  element.replaceWith(input);
  input.focus();
};

const renderTasks = () => {
  taskList.innerHTML = '';
  
  let filteredTasks = tasks;
  if (currentFilter === 'active') filteredTasks = tasks.filter(t => !t.completed);
  else if (currentFilter === 'completed') filteredTasks = tasks.filter(t => t.completed);

  filteredTasks.forEach(task => {
    taskList.appendChild(createTaskElement(task));
  });
};

const addTask = () => {
  const text = taskInput.value.trim();
  const date = dateInput.value;
  
  if (!text) return;

  const newTask = {
    id: Date.now(),
    text,
    dueDate: date,
    completed: false
  };

  tasks.push(newTask);
  saveTasks();
  renderTasks();
  
  taskInput.value = '';
  dateInput.value = '';
  taskInput.focus();
};

const toggleTask = (id) => {
  tasks = tasks.map(task => 
    task.id === id ? { ...task, completed: !task.completed } : task
  );
  saveTasks();
  renderTasks();
};

const updateTaskText = (id, newText) => {
  tasks = tasks.map(task => 
    task.id === id ? { ...task, text: newText } : task
  );
  saveTasks();
  renderTasks();
};

const deleteTask = (id) => {
  tasks = tasks.filter(task => task.id !== id);
  saveTasks();
  renderTasks();
};

const clearCompleted = () => {
  tasks = tasks.filter(task => !task.completed);
  saveTasks();
  renderTasks();
};

const setFilter = (filter) => {
  currentFilter = filter;
  filterBtns.forEach(btn => btn.classList.toggle('active', btn.dataset.filter === filter));
  renderTasks();
};

// Drag and Drop Logic for Reordering
const getDragAfterElement = (container, y) => {
  const draggableElements = [...container.querySelectorAll('.task-item:not(.dragging)')];
  
  return draggableElements.reduce((closest, child) => {
    const box = child.getBoundingClientRect();
    const offset = y - box.top - box.height / 2;
    if (offset < 0 && offset > closest.offset) {
      return { offset: offset, element: child };
    } else {
      return closest;
    }
  }, { offset: Number.NEGATIVE_INFINITY }).element;
};

taskList.addEventListener('dragover', (e) => {
  e.preventDefault();
  const afterElement = getDragAfterElement(taskList, e.clientY);
  const draggable = document.querySelector('.dragging');
  if (afterElement == null) {
    taskList.appendChild(draggable);
  } else {
    taskList.insertBefore(draggable, afterElement);
  }
});

const saveNewOrder = () => {
    const newOrderIds = [...taskList.querySelectorAll('.task-item')].map(li => Number(li.dataset.id));
    // Sort tasks array based on the visual order
    tasks.sort((a, b) => newOrderIds.indexOf(a.id) - newOrderIds.indexOf(b.id));
    saveTasks();
};


// Event Listeners
addBtn.addEventListener('click', addTask);
taskInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') addTask();
});

clearBtn.addEventListener('click', clearCompleted);

filterBtns.forEach(btn => {
  btn.addEventListener('click', () => setFilter(btn.dataset.filter));
});

// Initial Render
renderTasks();
