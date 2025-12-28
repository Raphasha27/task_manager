import './style.css';

// State Management
let tasks = JSON.parse(localStorage.getItem('tasks')) || [];

// DOM Elements
const taskInput = document.getElementById('taskInput');
const addBtn = document.getElementById('addBtn');
const taskList = document.getElementById('taskList');

// Functions
const saveTasks = () => {
  localStorage.setItem('tasks', JSON.stringify(tasks));
};

const createTaskElement = (task) => {
  const li = document.createElement('li');
  li.className = `task-item ${task.completed ? 'completed' : ''}`;
  li.dataset.id = task.id;

  li.innerHTML = `
    <div class="task-content">
      <input type="checkbox" class="checkbox" ${task.completed ? 'checked' : ''}>
      <span class="task-text">${task.text}</span>
    </div>
    <button class="delete-btn">Delete</button>
  `;

  // Event Listeners for dynamic elements
  const checkbox = li.querySelector('.checkbox');
  checkbox.addEventListener('change', () => toggleTask(task.id));

  const deleteBtn = li.querySelector('.delete-btn');
  deleteBtn.addEventListener('click', () => deleteTask(task.id));

  return li;
};

const renderTasks = () => {
  taskList.innerHTML = '';
  tasks.forEach(task => {
    taskList.appendChild(createTaskElement(task));
  });
};

const addTask = () => {
  const text = taskInput.value.trim();
  if (!text) return;

  const newTask = {
    id: Date.now(),
    text,
    completed: false
  };

  tasks.push(newTask);
  saveTasks();
  renderTasks();
  taskInput.value = '';
  taskInput.focus();
};

const toggleTask = (id) => {
  tasks = tasks.map(task => 
    task.id === id ? { ...task, completed: !task.completed } : task
  );
  saveTasks();
  renderTasks();
};

const deleteTask = (id) => {
  tasks = tasks.filter(task => task.id !== id);
  saveTasks();
  renderTasks();
};

// Event Listeners
addBtn.addEventListener('click', addTask);

taskInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') addTask();
});

// Initial Render
renderTasks();
