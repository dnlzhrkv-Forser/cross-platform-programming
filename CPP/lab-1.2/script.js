// Кнопка дії: показує повідомлення та плавно прокручує до списку функцій
const actionBtn = document.getElementById('actionBtn');
const actionMsg = document.getElementById('actionMsg');

actionBtn.addEventListener('click', () => {
  actionMsg.textContent = 'Каталог ліків буде доступний у наступних лабораторних роботах.';
  document.getElementById('features').scrollIntoView({ behavior: 'smooth' });
});
