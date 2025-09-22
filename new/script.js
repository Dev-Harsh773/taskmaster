// TaskMaster Application
class TaskMaster {
    constructor() {
        this.tasks = JSON.parse(localStorage.getItem('taskmaster-tasks')) || this.getDefaultTasks();
        this.currentPage = 'dashboard';
        this.currentFilter = 'all';
        this.currentDate = new Date();
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadPage('dashboard');
        this.updateStats();
    }

    getDefaultTasks() {
        return [{
                id: 1,
                name: 'Draft proposal for client',
                description: 'Create a detailed proposal, including scope, timeline, and budget.',
                priority: 'high',
                status: 'in-progress',
                dueDate: '2025-09-30',
                subtasks: [
                    { id: 1, name: 'Research market trends', completed: true },
                    { id: 2, name: 'Define project scope', completed: true },
                    { id: 3, name: 'Create timeline', completed: false }
                ]
            },
            {
                id: 2,
                name: 'Design new mockups',
                description: 'Create high-fidelity mockups for the new dashboard design.',
                priority: 'medium',
                status: 'completed',
                dueDate: '2025-09-15',
                subtasks: [
                    { id: 1, name: 'Wireframe layouts', completed: true },
                    { id: 2, name: 'Update design system', completed: true }
                ]
            },
            {
                id: 3,
                name: 'Develop dashboard features',
                description: 'Implement new dashboard features based on user feedback.',
                priority: 'high',
                status: 'in-progress',
                dueDate: '2025-10-05',
                subtasks: []
            },
            {
                id: 4,
                name: 'Conduct user testing',
                description: 'Organize and conduct user testing sessions for the new features.',
                priority: 'medium',
                status: 'pending',
                dueDate: '2025-10-10',
                subtasks: []
            }
        ];
    }

    bindEvents() {
        // Navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', () => this.loadPage(item.dataset.page));
        });

        // Add task buttons
        document.querySelectorAll('.add-task-btn').forEach(btn => {
            btn.addEventListener('click', () => this.openTaskModal());
        });

        // Modal events
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', () => this.closeModals());
        });
        document.querySelectorAll('.modal-overlay').forEach(overlay => {
            overlay.addEventListener('click', e => {
                if (e.target === overlay) this.closeModals();
            });
        });

        // Task form
        document.getElementById('task-form').addEventListener('submit', e => {
            e.preventDefault();
            this.addTask();
        });

        // Task filters
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.currentFilter = btn.dataset.filter;
                this.updateFilterButtons();
                this.renderTasks();
            });
        });

        // Calendar navigation
        document.getElementById('prev-month').addEventListener('click', () => {
            this.currentDate.setMonth(this.currentDate.getMonth() - 1);
            this.renderCalendar();
        });
        document.getElementById('next-month').addEventListener('click', () => {
            this.currentDate.setMonth(this.currentDate.getMonth() + 1);
            this.renderCalendar();
        });

        // Task detail modal actions
        document.getElementById('edit-task-btn').addEventListener('click', () => this.editCurrentTask());
        document.getElementById('delete-task-btn').addEventListener('click', () => this.deleteCurrentTask());
        document.getElementById('complete-task-btn').addEventListener('click', () => this.toggleTaskComplete());
    }

    loadPage(pageName) {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.page === pageName);
        });
        document.querySelectorAll('.page').forEach(page => {
            page.classList.toggle('active', page.id === `${pageName}-page`);
        });
        this.currentPage = pageName;

        switch (pageName) {
            case 'dashboard': this.renderDashboard(); break;
            case 'tasks': this.renderTasks(); break;
            case 'calendar': this.renderCalendar(); break;
        }
    }

    renderDashboard() {
        this.renderUpcomingTasks();
        this.updateStats();
        this.renderOverallProgress();
    }

    renderUpcomingTasks() {
        const container = document.getElementById('upcoming-tasks');
        const upcoming = this.tasks
            .filter(task => task.status !== 'completed')
            .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
            .slice(0, 5);
        container.innerHTML = upcoming.map(task => `
            <div class="table-row" onclick="app.openTaskDetail(${task.id})">
                <div class="td task-name">
                    <div class="task-info">
                        <i class="fas fa-circle task-priority ${task.priority}"></i>
                        <span>${task.name}</span>
                    </div>
                </div>
                <div class="td">${this.formatDate(task.dueDate)}</div>
                <div class="td"><span class="status-badge ${task.status}">${task.status.replace('-', ' ')}</span></div>
                <div class="td task-actions">
                    <button class="action-btn view" onclick="event.stopPropagation(); app.openTaskDetail(${task.id})"><i class="fas fa-eye"></i></button>
                    <button class="action-btn edit" onclick="event.stopPropagation(); app.editTask(${task.id})"><i class="fas fa-edit"></i></button>
                    <button class="action-btn ${task.status === 'completed' ? 'completed' : 'complete'}" onclick="event.stopPropagation(); app.toggleTaskStatus(${task.id})"><i class="fas fa-check"></i></button>
                </div>
            </div>
        `).join('');
    }

    renderTasks() {
        const container = document.getElementById('tasks-list');
        let filteredTasks = this.tasks.filter(task => this.currentFilter === 'all' || task.status === this.currentFilter);
        
        container.innerHTML = filteredTasks.map(task => `
            <div class="task-card" data-task-id="${task.id}">
                <div class="task-header">
                    <div class="task-main-info">
                        <h3 class="task-title">${task.name}</h3>
                        <p class="task-description">${task.description}</p>
                    </div>
                    <div class="task-meta">
                        <span class="priority-badge ${task.priority}">${task.priority}</span>
                        <span class="status-badge ${task.status}">${task.status.replace('-', ' ')}</span>
                    </div>
                </div>
                <div class="task-details">
                    <div class="task-info-row">
                        <span class="task-due-date"><i class="fas fa-calendar"></i> ${this.formatDate(task.dueDate)}</span>
                    </div>
                    ${task.subtasks.length > 0 ? `
                        <div class="subtasks-preview">
                            <span class="subtasks-count">${task.subtasks.filter(s => s.completed).length}/${task.subtasks.length} subtasks completed</span>
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: ${(task.subtasks.filter(s => s.completed).length / task.subtasks.length) * 100}%"></div>
                            </div>
                        </div>
                    ` : ''}
                    <div class="task-actions">
                        <button class="action-btn view" onclick="app.openTaskDetail(${task.id})"><i class="fas fa-eye"></i><span>View</span></button>
                        <button class="action-btn edit" onclick="app.editTask(${task.id})"><i class="fas fa-edit"></i><span>Edit</span></button>
                        <button class="action-btn ${task.status === 'completed' ? 'completed' : 'complete'}" onclick="app.toggleTaskStatus(${task.id})"><i class="fas fa-check"></i><span>${task.status === 'completed' ? 'Completed' : 'Complete'}</span></button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    renderCalendar() {
        const title = document.getElementById('calendar-title');
        const grid = document.getElementById('calendar-grid');
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        
        title.textContent = this.currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        
        let html = '<div class="calendar-weekdays">' + ['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(day => `<div class="weekday">${day}</div>`).join('') + '</div><div class="calendar-days">';
        
        for (let i = 0; i < firstDay; i++) html += '<div class="calendar-day empty"></div>';
        
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const dateStr = date.toISOString().split('T')[0];
            const tasksForDay = this.tasks.filter(task => task.dueDate === dateStr);
            const isToday = dateStr === new Date().toISOString().split('T')[0];
            
            html += `
                <div class="calendar-day ${isToday ? 'today' : ''} ${tasksForDay.length > 0 ? 'has-tasks' : ''}">
                    <span class="day-number">${day}</span>
                    ${tasksForDay.length > 0 ? `
                        <div class="day-tasks">
                            ${tasksForDay.slice(0, 3).map(task => `<div class="day-task ${task.priority}" title="${task.name}"><span class="task-dot"></span></div>`).join('')}
                            ${tasksForDay.length > 3 ? `<div class="more-tasks">+${tasksForDay.length - 3}</div>` : ''}
                        </div>
                    ` : ''}
                </div>
            `;
        }
        grid.innerHTML = html + '</div>';
    }

    updateStats() {
        document.getElementById('completed-count').textContent = this.tasks.filter(t => t.status === 'completed').length;
        document.getElementById('progress-count').textContent = this.tasks.filter(t => t.status === 'in-progress').length;
        document.getElementById('upcoming-count').textContent = this.tasks.filter(t => {
            const due = new Date(t.dueDate);
            const today = new Date();
            const diff = (due - today) / (1000 * 60 * 60 * 24);
            return diff <= 7 && diff >= 0 && t.status !== 'completed';
        }).length;
    }
    renderOverallProgress() {
        const totalTasks = this.tasks.length;
        const percentageDisplay = document.getElementById('overall-progress-percentage');
        const fillDisplay = document.getElementById('overall-progress-fill');

        if (totalTasks === 0) {
            percentageDisplay.textContent = 'N/A';
            fillDisplay.style.width = '0%';
            return;
        }

        const completedTasks = this.tasks.filter(t => t.status === 'completed').length;
        const percentage = Math.round((completedTasks / totalTasks) * 100);

        percentageDisplay.textContent = `${percentage}%`;
        fillDisplay.style.width = `${percentage}%`;
    }

    updateFilterButtons() {
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === this.currentFilter);
        });
    }

    openTaskModal(task = null) {
        const modal = document.getElementById('task-modal');
        const form = document.getElementById('task-form');
        const title = modal.querySelector('.modal-title');
        
        form.reset();
        delete form.dataset.editId;
        
        if (task) {
            title.textContent = 'Edit Task';
            form.querySelector('button[type="submit"]').innerHTML = '<i class="fas fa-save"></i> Save Changes';
            document.getElementById('task-name').value = task.name;
            document.getElementById('task-description').value = task.description;
            document.getElementById('task-priority').value = task.priority;
            document.getElementById('task-due-date').value = task.dueDate;
            document.getElementById('task-subtasks').value = task.subtasks.map(s => s.name).join('\n');
            form.dataset.editId = task.id;
        } else {
            title.textContent = 'Add New Task';
            form.querySelector('button[type="submit"]').innerHTML = '<i class="fas fa-plus"></i> Add Task';
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            document.getElementById('task-due-date').value = tomorrow.toISOString().split('T')[0];
            document.getElementById('task-subtasks').value = '';
        }
        
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    openTaskDetail(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task) return;

        const modal = document.getElementById('task-detail-modal');
        document.getElementById('detail-task-name').textContent = task.name;
        document.getElementById('detail-description').textContent = task.description;
        document.getElementById('detail-due-date').textContent = this.formatDate(task.dueDate);
        document.getElementById('detail-priority').textContent = task.priority;
        document.getElementById('detail-priority').className = `priority-badge ${task.priority}`;

        const subtasksContainer = document.getElementById('detail-subtasks');
        subtasksContainer.innerHTML = task.subtasks.length > 0 ?
            task.subtasks.map(sub => `
                <div class="subtask-item ${sub.completed ? 'completed' : ''}">
                    <input type="checkbox" ${sub.completed ? 'checked' : ''} onchange="app.toggleSubtask(${task.id}, ${sub.id})">
                    <span class="subtask-name">${sub.name}</span>
                </div>
            `).join('') :
            '<p class="no-subtasks">No subtasks for this task.</p>';

        const completeBtn = document.getElementById('complete-task-btn');
        completeBtn.innerHTML = task.status === 'completed' ? '<i class="fas fa-undo"></i> Mark Incomplete' : '<i class="fas fa-check"></i> Mark Complete';
        completeBtn.className = task.status === 'completed' ? 'secondary-btn' : 'success-btn';

        modal.dataset.taskId = taskId;
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    closeModals() {
        document.querySelectorAll('.modal-overlay').forEach(modal => modal.classList.remove('active'));
        document.body.style.overflow = '';
    }

    addTask() {
        const form = document.getElementById('task-form');
        const editId = form.dataset.editId;
        
        const taskData = {
            name: document.getElementById('task-name').value.trim(),
            description: document.getElementById('task-description').value.trim(),
            priority: document.getElementById('task-priority').value,
            dueDate: document.getElementById('task-due-date').value,
        };
        
        const subtaskInput = document.getElementById('task-subtasks').value;
        const subtasks = subtaskInput.split('\n')
            .filter(line => line.trim() !== '')
            .map((name, index) => ({ id: Date.now() + index, name: name.trim(), completed: false }));

        if (editId) {
            const index = this.tasks.findIndex(t => t.id === parseInt(editId));
            if (index !== -1) {
                this.tasks[index] = { ...this.tasks[index], ...taskData, subtasks: subtasks };
            }
        } else {
            this.tasks.unshift({
                id: Date.now(),
                status: 'pending',
                ...taskData,
                subtasks: subtasks
            });
        }

        this.saveTasks();
        this.closeModals();
        this.refreshCurrentView();
        this.showNotification(editId ? 'Task updated successfully!' : 'Task added successfully!', 'success');
    }

    editTask(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task) this.openTaskModal(task);
    }

    editCurrentTask() {
        const taskId = parseInt(document.getElementById('task-detail-modal').dataset.taskId);
        this.closeModals();
        setTimeout(() => this.editTask(taskId), 300);
    }

    deleteCurrentTask() {
        const taskId = parseInt(document.getElementById('task-detail-modal').dataset.taskId);
        if (confirm('Are you sure you want to delete this task?')) {
            this.tasks = this.tasks.filter(t => t.id !== taskId);
            this.saveTasks();
            this.closeModals();
            this.refreshCurrentView();
            this.showNotification('Task deleted.', 'success');
        }
    }

    toggleTaskStatus(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task) {
            task.status = task.status === 'completed' ? 'pending' : 'completed';
            this.saveTasks();
            this.refreshCurrentView();
            this.showNotification(`Task marked as ${task.status}!`, 'success');
        }
    }

    toggleTaskComplete() {
        const taskId = parseInt(document.getElementById('task-detail-modal').dataset.taskId);
        this.toggleTaskStatus(taskId);
        this.closeModals();
    }

    toggleSubtask(taskId, subtaskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task) {
            const subtask = task.subtasks.find(s => s.id === subtaskId);
            if (subtask) {
                subtask.completed = !subtask.completed;
                this.saveTasks();
                this.refreshCurrentView();
                // Re-open detail view to see change if user is on that modal
                if(document.getElementById('task-detail-modal').classList.contains('active')) {
                    this.openTaskDetail(taskId);
                }
            }
        }
    }

    refreshCurrentView() {
        this.loadPage(this.currentPage);
        this.updateStats();
    }

    saveTasks() {
        localStorage.setItem('taskmaster-tasks', JSON.stringify(this.tasks));
    }

    formatDate(dateStr) {
        return new Date(dateStr).toLocaleDateString('en-US', {
            year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC'
        });
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `<div class="notification-content"><i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-info-circle'}"></i><span>${message}</span></div>`;
        document.body.appendChild(notification);
        setTimeout(() => notification.classList.add('show'), 10);
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}

// Initialize the application
const app = new TaskMaster();