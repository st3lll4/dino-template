document.addEventListener('DOMContentLoaded', () => {
  console.log('popup loaded');

  let button = document.getElementById('sayhi');

  button?.addEventListener('click', () => console.log('hi!'));
});