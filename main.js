import './style.css';

// State Management
let tasks = (() => {
  try { return JSON.parse(localStorage.getItem('tasks')); }
  catch { return null; }
})() || [
  { id: 1, text: 'Complete the project documentation', completed: true, dueDate: null, timeSpent: 0, isRunning: false },
  { id: 2, text: 'Review pull requests', completed: false, dueDate: '2025-01-15', timeSpent: 3600, isRunning: false }, // 1 hr example
  { id: 3, text: 'Design system update', completed: false, dueDate: null, timeSpent: 0, isRunning: false }
];
let currentFilter = 'all';
let timerInterval = null;

// DOM Elements
const taskInput = document.getElementById('taskInput');
const dateInput = document.getElementById('dateInput');
const addBtn = document.getElementById('addBtn');
const taskList = document.getElementById('taskList');
const filterBtns = document.querySelectorAll('.filter-btn');
const clearBtn = document.getElementById('clearBtn');
const aiBtn = document.getElementById('aiBtn');
const aiPanel = document.getElementById('aiPanel');
const closeAiBtn = document.getElementById('closeAiBtn');
const aiContent = document.getElementById('aiContent');
const dateWrapper = document.querySelector('.date-wrapper');

// Functions
const updateDateDisplay = () => {
    const display = document.querySelector('.calendar-icon');
    if (dateInput.value) {
        display.innerText = formatDate(dateInput.value);
        display.style.fontSize = '0.9rem';
        display.style.color = '#00d2ff';
        display.style.fontWeight = '600';
        display.style.textShadow = '0 0 10px rgba(0, 210, 255, 0.6)';
    } else {
        display.innerText = '📅';
        display.style.fontSize = '1.4rem';
        display.style.color = 'inherit';
        display.style.textShadow = 'none';
    }
};

const saveTasks = () => {
  try {
    const tasksToSave = tasks.map(t => ({ ...t, isRunning: false }));
    localStorage.setItem('tasks', JSON.stringify(tasksToSave));
  } catch (e) {
    console.warn('Failed to save tasks to localStorage:', e);
  }
};

const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const createTaskElement = (task) => {
  const li = document.createElement('li');
  li.className = `task-item ${task.completed ? 'completed' : ''}`;
  li.dataset.id = task.id;
  li.draggable = true;

  li.innerHTML = `
    <div class="drag-handle">⋮⋮</div>
    
    <div class="checkbox-wrapper">
      <input type="checkbox" class="checkbox" ${task.completed ? 'checked' : ''}>
    </div>
    
    <div class="task-content">
      <span class="task-text">${task.text}</span>
    </div>

    <div class="task-meta">
      ${task.dueDate ? `<div class="task-date">📅 ${formatDate(task.dueDate)}</div>` : ''}
      
      <div class="timer-container">
         <span class="timer-display" id="timer-${task.id}">${formatTime(task.timeSpent)}</span>
         <button class="timer-btn ${task.isRunning ? 'active' : ''}" title="${task.isRunning ? 'Stop Timer' : 'Start Timer'}">
            ${task.isRunning ? '⏹' : '▶'}
         </button>
      </div>

      <button class="delete-btn" title="Delete">🗑</button>
    </div>
  `;

  // Interaction Logic
  const checkbox = li.querySelector('.checkbox');
  checkbox.addEventListener('change', () => toggleTask(task.id));

  const deleteBtn = li.querySelector('.delete-btn');
  if (deleteBtn) {
    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      deleteTask(task.id);
    });
  }
  
  // Timer Logic
  const timerBtn = li.querySelector('.timer-btn');
  timerBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleTimer(task.id);
  });

  // Edit Feature
  const taskText = li.querySelector('.task-text');
  taskText.addEventListener('dblclick', () => enableEditMode(task, taskText));

  // Drag Events
  li.addEventListener('dragstart', () => li.classList.add('dragging'));
  li.addEventListener('dragend', () => {
    li.classList.remove('dragging');
    saveNewOrder();
  });

  return li;
};

const enableEditMode = (task, element) => {
  const input = document.createElement('input');
  input.type = 'text';
  input.value = task.text;
  Object.assign(input.style, {
    background: 'transparent', border: 'none', borderBottom: '1px solid #00d2ff',
    color: 'white', fontSize: '1.1rem', width: '100%', padding: '0'
  });
  
  const saveEdit = () => {
    const newText = input.value.trim();
    if (newText) { updateTaskText(task.id, newText); } else { renderTasks(); }
  };
  input.addEventListener('blur', saveEdit);
  input.addEventListener('keypress', (e) => { if (e.key === 'Enter') saveEdit(); });
  element.replaceWith(input);
  input.focus();
};

const renderTasks = () => {
  // Store scrolling position or handle it carefully, but simplified re-render for now
  taskList.innerHTML = '';
  let filteredTasks = tasks;
  if (currentFilter === 'active') filteredTasks = tasks.filter(t => !t.completed);
  else if (currentFilter === 'completed') filteredTasks = tasks.filter(t => t.completed);

  filteredTasks.forEach(task => {
    taskList.appendChild(createTaskElement(task));
  });
};

const addTask = () => {
  if (!taskInput) return;
  const text = taskInput.value.trim();
  const date = dateInput ? dateInput.value : '';
  if (!text) return;

  const newTask = {
    id: Date.now(),
    text,
    dueDate: date,
    completed: false,
    timeSpent: 0,
    isRunning: false
  };

  tasks.push(newTask);
  saveTasks();
  renderTasks();
  taskInput.value = '';
  if (dateInput) dateInput.value = '';
  updateDateDisplay();
  taskInput.focus();
};

const toggleTask = (id) => {
  tasks = tasks.map(task => task.id === id ? { ...task, completed: !task.completed } : task);
  saveTasks();
  renderTasks();
};

const updateTaskText = (id, newText) => {
  tasks = tasks.map(task => task.id === id ? { ...task, text: newText } : task);
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

// Drag & Drop
const getDragAfterElement = (container, y) => {
  const draggableElements = [...container.querySelectorAll('.task-item:not(.dragging)')];
  return draggableElements.reduce((closest, child) => {
    const box = child.getBoundingClientRect();
    const offset = y - box.top - box.height / 2;
    if (offset < 0 && offset > closest.offset) return { offset: offset, element: child };
    else return closest;
  }, { offset: Number.NEGATIVE_INFINITY }).element;
};

taskList.addEventListener('dragover', (e) => {
  e.preventDefault();
  const afterElement = getDragAfterElement(taskList, e.clientY);
  const draggable = document.querySelector('.dragging');
  if (afterElement == null) taskList.appendChild(draggable);
  else taskList.insertBefore(draggable, afterElement);
});

const saveNewOrder = () => {
    const newOrderIds = [...taskList.querySelectorAll('.task-item')].map(li => Number(li.dataset.id));
    tasks.sort((a, b) => newOrderIds.indexOf(a.id) - newOrderIds.indexOf(b.id));
    saveTasks();
};

// --- Timer Logic ---
const toggleTimer = (id) => {
    // Only allow one timer to run at a time? Or multiple? Let's allow multiple for flexibility, or single for strictness.
    // Let's go with single active timer for sanity.
    tasks = tasks.map(task => {
        if (task.id === id) {
            return { ...task, isRunning: !task.isRunning };
        } else {
             // Optional: Stop others if we start one?
            return { ...task, isRunning: false }; // Auto-stop others
        }
    });
    renderTasks();
};

// Global Interval for Timer Updates
if (timerInterval) clearInterval(timerInterval);
timerInterval = setInterval(() => {
    let hasRunning = false;
    tasks = tasks.map(task => {
        if (task.isRunning) {
            hasRunning = true;
            return { ...task, timeSpent: task.timeSpent + 1 };
        }
        return task;
    });

    if (hasRunning) {
        // Optimize: Update only DOM elements instead of full re-render every second
        tasks.forEach(task => {
            if (task.isRunning) {
                const display = document.getElementById(`timer-${task.id}`);
                if (display) display.innerText = formatTime(task.timeSpent);
            }
        });
        // Save occasionally? Every 10s? Let's save on stop to avoid IO thrashing, or just memory for now.
    }
}, 1000);

// --- AI Logic ---
const generateAIInsights = () => {
    const activeCount = tasks.filter(t => !t.completed).length;
    const completedCount = tasks.filter(t => t.completed).length;
    const highPriority = tasks.filter(t => !t.completed && (t.text.toLowerCase().includes('urgent') || t.text.toLowerCase().includes('important')));
    
    let insights = [];
    
    if (activeCount === 0) {
        insights.push("🎉 Amazing work! Your inbox is empty. Time to relax or learn something new.");
    } else if (activeCount > 5) {
        insights.push("⚡ You have a lot on your plate (" + activeCount + " tasks). Try prioritizing the top 3 and ignoring the rest for now.");
    }

    if (highPriority.length > 0) {
        insights.push(`🔥 Focus on your high priority tasks: "${highPriority[0].text}" seems important.`);
    }

    // Contextual suggestions based on task keywords
    tasks.forEach(t => {
        if (!t.completed) {
            const txt = t.text.toLowerCase();
            if (txt.includes('design') || txt.includes('ui')) insights.push(`🎨 For "${t.text}": Check Dribbble or Pinterest for modern glassmorphism inspiration.`);
            if (txt.includes('bug') || txt.includes('fix')) insights.push(`🐛 For "${t.text}": Have you checked the console logs and network tab?`);
            if (txt.includes('write') || txt.includes('blog')) insights.push(`✍️ For "${t.text}": Try a quick outline first. Don't edit while you write!`);
            if (txt.includes('review')) insights.push(`👀 For "${t.text}": Look for edge cases and performance impacts.`);
        }
    });

    if (insights.length === 0) insights.push("💡 Tip: Break big tasks into smaller, manageable chunks (sub-tasks).");

    return insights;
};

const toggleAI = () => {
    const isHidden = aiPanel.classList.contains('hidden');
    if (isHidden) {
        aiPanel.classList.remove('hidden');
        const insights = generateAIInsights();
        aiContent.innerHTML = insights.map(i => `<div class="ai-suggestion-item">${i}</div>`).join('');
    } else {
        aiPanel.classList.add('hidden');
    }
};

// Event Listeners
if (aiBtn) aiBtn.addEventListener('click', toggleAI);
if (closeAiBtn) closeAiBtn.addEventListener('click', () => aiPanel && aiPanel.classList.add('hidden'));

if (addBtn) addBtn.addEventListener('click', addTask);
if (taskInput) taskInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') addTask(); });

// Date Picker Handling
if (dateInput) dateInput.addEventListener('change', updateDateDisplay);

if (dateWrapper) {
  dateWrapper.addEventListener('click', () => {
    try {
      dateInput.showPicker();
    } catch (err) {
      console.warn("date picker fallback", err);
      if (dateInput) { dateInput.focus(); dateInput.click(); }
    }
  });
}

if (clearBtn) clearBtn.addEventListener('click', clearCompleted);
if (filterBtns) filterBtns.forEach(btn => { btn.addEventListener('click', () => setFilter(btn.dataset.filter)); });

// Initial Render
renderTasks();
