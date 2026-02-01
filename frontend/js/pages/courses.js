document.querySelectorAll('.start-btn').forEach(button => {
  button.addEventListener('click', () => {
    window.location.href = 'page4.html';
  });
});

document.addEventListener('DOMContentLoaded', function () {
  const toggleBtn = document.getElementById('theme-toggle');
  const currentTheme = localStorage.getItem('theme') || 'light';

  if (currentTheme === 'dark') {
    document.body.classList.add('dark-mode');
    document.querySelector('.navbar').classList.add('dark-mode');
    document.querySelector('.footer').classList.add('dark-mode');
    toggleBtn.textContent = '☀️'; 
  } else {
    toggleBtn.textContent = '🌙';  
  }

  toggleBtn.addEventListener('click', function () {
    const isDark = document.body.classList.toggle('dark-mode');
    document.querySelector('.navbar').classList.toggle('dark-mode');
    document.querySelector('.footer').classList.toggle('dark-mode');

    toggleBtn.textContent = isDark ? '☀️' : '🌙';

    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  });
});

