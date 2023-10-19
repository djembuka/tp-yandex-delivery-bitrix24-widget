window.twpxYadeliveryLocation.locationJS = (params) => {
  //location input
  let activeLocationItemIndex;
  let oldIndex;
  let items = [];
  const locationBlock = document.querySelector('.twpx-ydw-location');
  const button = locationBlock.querySelector('.twpx-ydw-location-btn');
  const block = locationBlock.querySelector('.twpx-ydw-location-form-control');
  const control = block.querySelector('input');
  const close = block.querySelector('.twpx-ydw-location-form-close');
  const wrapper = block.querySelector('.twpx-ydw-location-dropdown-wrapper');
  const back = locationBlock.querySelector('.twpx-ydw-location-back');
  const error = locationBlock.querySelector('.twpx-ydw-location-error');

  if (control.value.trim() !== '') {
    block.classList.add('twpx-ydw-location-form-control--active');
    button.classList.remove('twpx-ydw-location-btn--disabled');
    activeLocationItemIndex = true;
  } else {
    block.classList.remove('twpx-ydw-location-form-control--active');
    button.classList.add('twpx-ydw-location-btn--disabled');
    activeLocationItemIndex = undefined;
  }

  if (params.error) {
    showError(params.error);
  }

  control.addEventListener('focus', () => {
    focusControl();
  });

  control.addEventListener('blur', () => {
    blurControl();
  });

  control.addEventListener('keyup', (e) => {
    keyupControl(e);
  });

  control.addEventListener('keydown', (e) => {
    keydownControl(e);
  });

  close.addEventListener('click', () => {
    clickClose();
  });

  wrapper.addEventListener('click', (e) => {
    if (e.target.classList.contains('twpx-ydw-location-dropdown-item')) {
      clickItem(e.target);
    }
  });

  button.addEventListener('click', (e) => {
    e.preventDefault();
    document.dispatchEvent(
      new CustomEvent('twpxYdwLocationChosen', { detail: control.value })
    );
  });

  back.addEventListener('click', (e) => {
    e.preventDefault();
    document.dispatchEvent(new CustomEvent('twpxYdwCloseLocation'));
  });

  document.addEventListener('click', (e) => {
    if (
      e.target.className !== 'twpx-ydw-location-dropdown-item' &&
      e.target.className !== 'twpx-ydw-location-input'
    ) {
      reset();
    }
  });

  function focusControl() {
    block.classList.add('twpx-ydw-location-form-control--active');
  }

  function blurControl() {
    if (control.value.trim() !== '') {
      block.classList.add('twpx-ydw-location-form-control--active');
    } else {
      block.classList.remove('twpx-ydw-location-form-control--active');
    }
  }

  function keyupControl(keyEvent) {
    if (
      keyEvent.code === 'ArrowUp' ||
      keyEvent.code === 'ArrowDown' ||
      keyEvent.code === 'NumpadEnter' ||
      keyEvent.code === 'Enter'
    ) {
      return;
    }

    activeLocationItemIndex = undefined;

    //show close
    if (control.value.trim() !== '') {
      block.classList.add('twpx-ydw-location-form-control--close');
    } else {
      block.classList.remove('twpx-ydw-location-form-control--close');
    }

    reset();

    //send request
    if (control.value.trim().length >= 3) {
      //send request
      sendRequest(block, control, wrapper);
    }
  }

  function keydownControl(keyEvent) {
    if (keyEvent.code === 'ArrowUp') {
      upArrow(control, items);
    } else if (keyEvent.code === 'ArrowDown') {
      downArrow(control, items);
    } else if (keyEvent.code === 'Enter' || keyEvent.code === 'NumpadEnter') {
      enterInput(control, items, wrapper);
    }
  }

  async function sendRequest() {
    const url = block.getAttribute('data-url');
    const method = block.getAttribute('data-method');
    const fetchTimeout = 20000;

    let formData = new FormData(),
      controller = new AbortController(),
      response,
      result;

    formData.set('string', control.value);

    setTimeout(() => {
      if (!response) {
        controller.abort();
      }
    }, fetchTimeout);

    try {
      block.classList.add('twpx-ydw-location-form-control--loading');

      response = await fetch(url, {
        method: method,
        // body: formData,
        // signal: controller.signal,
      });

      result = await response.json();

      block.classList.remove('twpx-ydw-location-form-control--loading');

      if (result && typeof result === 'object') {
        if (result.status === 'success') {
          if (result.errors) {
            showError(result.errors[0].message);
          } else if (result.data && result.data.locationList) {
            let itemsHTML = '';
            result.data.locationList.forEach((name) => {
              itemsHTML += `<div class="twpx-ydw-location-dropdown-item">${name}</div>`;
            });
            wrapper.innerHTML = itemsHTML;
            items = wrapper.querySelectorAll(
              '.twpx-ydw-location-dropdown-item'
            );
          }
        } else {
          showError('Ошибка соединения');
        }
      }
    } catch (err) {
      showError('Ошибка соединения');
      throw err;
    }
  }

  function upArrow() {
    oldIndex = activeLocationItemIndex;

    //active index
    if (activeLocationItemIndex === undefined) {
      activeLocationItemIndex = items.length - 1;
    } else {
      --activeLocationItemIndex;
      if (activeLocationItemIndex < 0) {
        activeLocationItemIndex = items.length - 1;
      }
    }

    highlightItem();
  }

  function downArrow() {
    oldIndex = activeLocationItemIndex;

    //active index
    if (activeLocationItemIndex === undefined) {
      activeLocationItemIndex = 0;
    } else {
      ++activeLocationItemIndex;
      if (activeLocationItemIndex > items.length - 1) {
        activeLocationItemIndex = 0;
      }
    }

    highlightItem();
  }

  function highlightItem() {
    //hightlight
    if (items[oldIndex]) {
      items[oldIndex].classList.remove(
        'twpx-ydw-location-dropdown-item--active'
      );
    }

    items[activeLocationItemIndex].classList.add(
      'twpx-ydw-location-dropdown-item--active'
    );

    //set value
    control.value = items[activeLocationItemIndex].textContent;
  }

  function clickItem(item) {
    control.value = item.textContent;
    control.blur();
    reset();
    activeLocationItemIndex = 0;
    button.classList.remove('twpx-ydw-location-btn--disabled');
  }

  function enterInput() {
    //check if there is an active item
    if (activeLocationItemIndex !== undefined) {
      control.value = items[activeLocationItemIndex].textContent;
      control.blur();
      reset();
      button.classList.remove('twpx-ydw-location-btn--disabled');
    }
  }

  function reset() {
    items = [];
    wrapper.innerHTML = '';
    if (activeLocationItemIndex === undefined) {
      button.classList.add('twpx-ydw-location-btn--disabled');
    }
  }

  function clickClose() {
    block.classList.remove('twpx-ydw-location-form-control--close');
    control.value = '';
    control.focus();
    activeLocationItemIndex = undefined;
    reset();
  }

  function showError(message) {
    locationBlock.classList.add('twpx-ydw-location--error');
    error.querySelector('.twpx-ydw-location-error-content').innerHTML = message;
  }
};
