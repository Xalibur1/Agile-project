document.addEventListener('DOMContentLoaded', () => {
    // User management
    let users = JSON.parse(localStorage.getItem('users')) || {};

    // Toggle between login and register
    const loginSection = document.getElementById('loginSection');
    const registerSection = document.getElementById('registerSection');
    const showRegister = document.getElementById('showRegister');
    const showLogin = document.getElementById('showLogin');

    if (showRegister && showLogin) {
        showRegister.addEventListener('click', (e) => {
            e.preventDefault();
            loginSection.style.display = 'none';
            registerSection.style.display = 'block';
        });

        showLogin.addEventListener('click', (e) => {
            e.preventDefault();
            registerSection.style.display = 'none';
            loginSection.style.display = 'block';
        });
    }

    // Registration functionality
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const username = document.getElementById('regUsername').value;
            const password = document.getElementById('regPassword').value;
            const confirmPassword = document.getElementById('confirmPassword').value;

            if (password !== confirmPassword) {
                alert('Passwords do not match!');
                return;
            }

            if (users[username]) {
                alert('Username already exists!');
                return;
            }

            users[username] = { password: password, expenses: [] };
            localStorage.setItem('users', JSON.stringify(users));
            localStorage.setItem('username', username);
            window.location.href = 'home.html';
        });
    }

    // Login functionality
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;

            if (!users[username] || users[username].password !== password) {
                alert('Invalid username or password!');
                return;
            }

            localStorage.setItem('username', username);
            window.location.href = 'home.html';
        });
    }

    // Check if user is logged in and initialize dashboard
    if (window.location.pathname.includes('home.html')) {
        const currentUser = localStorage.getItem('username');
        if (!currentUser || !users[currentUser]) {
            window.location.href = 'index.html';
        }
        initializeDashboard();
    }
});

// Dashboard functionality
function initializeDashboard() {
    const currentUser = localStorage.getItem('username');
    let users = JSON.parse(localStorage.getItem('users')) || {};
    let expenses = users[currentUser].expenses || [];
    const expenseForm = document.getElementById('expenseForm');
    const expenseList = document.getElementById('expenseList');
    let chart;

    // Logout
    document.getElementById('logoutBtn').addEventListener('click', () => {
        localStorage.removeItem('username');
        window.location.href = 'index.html';
    });

    // Add expense
    expenseForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const expense = {
            id: Date.now(),
            amount: Number(document.getElementById('amount').value),
            category: document.getElementById('category').value,
            date: document.getElementById('date').value
        };
        
        expenses.push(expense);
        users[currentUser].expenses = expenses;
        localStorage.setItem('users', JSON.stringify(users));
        expenseForm.reset();
        updateDisplay();
    });

    // Update display
    function updateDisplay() {
        expenseList.innerHTML = '';
        expenses.forEach(expense => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>₹${expense.amount.toFixed(2)}</td>
                <td>${expense.category}</td>
                <td>${expense.date}</td>
                <td><button class="delete-btn" onclick="deleteExpense(${expense.id})">Delete</button></td>
`           ;
            expenseList.appendChild(row);
        });
        updateChart();
        updateSuggestions();
    }

    // Delete expense
    window.deleteExpense = function(id) {
        expenses = expenses.filter(expense => expense.id !== id);
        users[currentUser].expenses = expenses;
        localStorage.setItem('users', JSON.stringify(users));
        updateDisplay();
    };

    // Update chart
    function updateChart() {
        const categories = {};
        expenses.forEach(expense => {
            categories[expense.category] = (categories[expense.category] || 0) + expense.amount;
        });
    
        if (chart) chart.destroy();
    
        chart = new Chart(document.getElementById('expenseChart'), {
            type: 'pie',
            data: {
                labels: Object.keys(categories),
                datasets: [{
                    data: Object.values(categories),
                    backgroundColor: Object.keys(categories).map(cat => {
                        // Assign different colors per category
                        const colorMap = {
                            food: '#FF6384',
                            travel: '#36A2EB',
                            shopping: '#FFCE56',
                            entertainment: '#4BC0C0',
                            utilities: '#9966FF',
                            others: '#C9CBCF'
                        };
                        return colorMap[cat] || '#AAAAAA'; // fallback color
                    })
                }]
            },
            options: {
                plugins: {
                    legend: {
                        labels: {
                            color: '#ffffff'  // <- Bright white text
                        }
                    }
                }
            }
        });
    }
    

    // Money saving suggestions
    function updateSuggestions() {
        const suggestionsList = document.getElementById('suggestionsList');
        const totalByCategory = {};
        let totalSpending = 0;

        expenses.forEach(expense => {
            totalByCategory[expense.category] = (totalByCategory[expense.category] || 0) + expense.amount;
            totalSpending += expense.amount;
        });

        suggestionsList.innerHTML = '<h3>Based on your spending patterns:</h3>';
        const suggestions = [];

        for (const [category, amount] of Object.entries(totalByCategory)) {
            const percentage = (amount / totalSpending) * 100;
            
            if (percentage > 30) {
                suggestions.push(`
                    You're spending ${percentage.toFixed(1)}% (₹${amount.toFixed(2)}) on ${category}. 
                    Consider reducing this by finding cheaper alternatives or cutting unnecessary expenses.
                `);
            }
        }

        suggestions.push('Consider investing your savings in low-risk options like index funds or a high-yield savings account.');
        
        suggestionsList.innerHTML += '<ul>' + suggestions.map(s => `<li>${s}</li>`).join('') + '</ul>';
    }

    // Initial display update
    updateDisplay();
}
