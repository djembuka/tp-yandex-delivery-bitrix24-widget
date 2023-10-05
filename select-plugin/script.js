window.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('select').forEach((select) => {
    new twpxSelect({ select });
  });

  document.addEventListener('click', (e) => {
    if (
      e.target.className !== 'twpx-select__dropdown-item' &&
      e.target.className !== 'twpx-select__content'
    ) {
      hideDropdown();
    }
  });
});
