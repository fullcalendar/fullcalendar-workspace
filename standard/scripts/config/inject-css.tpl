((cssText) => {
  const styleEl = document.createElement('style');
  styleEl.setAttribute('data-fullcalendar', '')
  styleEl.textContent = cssText;
  document.head.appendChild(styleEl);
})({{{ cssTextAsJson }}});
