class twpxSelectManager {
  constructor() {
    this.selectObject = {};
    document.addEventListener('click', (e) => {
      if (
        e.target.className !== 'twpx-select__dropdown-item' &&
        e.target.className !== 'twpx-select__content'
      ) {
        Object.values(this.selectObject).forEach((select) => {
          select.hideDropdown();
        });
      }
    });
  }

  add(twpxSelect) {
    this.selectObject[twpxSelect.id] = twpxSelect;
  }
}

window.twpxSelectManager = new twpxSelectManager();

class twpxSelect {
  constructor(params) {
    this.id = Math.floor(Math.random() * 100000);
    this.select = params.select;
    this.customOnChange = params.onChange;
    this.checked = params.checked;
    this.optionsArray = [];

    this.control = this.select.closest('[class*="-form-control"]');
    if (!this.control) return;

    if (this.select.tagName.toLowerCase() === 'select') {
      this.label = this.control.querySelector('[class*="-label"]');
      this.isDisabled = this.select.getAttribute('disabled') === 'disabled';
      this.selectDiv = document.createElement('div');
      this.selectDiv.setAttribute('data-id', this.id);

      this.createOptionsArray();

      this.createSelectDiv(null, null, this.checked);
    } else if (
      this.select.tagName.toLowerCase() === 'div' &&
      this.select.classList.contains('twpx-select')
    ) {
      this.selectDiv = this.select;
      this.selectDiv.setAttribute('data-id', this.id);

      this.divElements();
      this.divEvents();

      this.createOptionsArray();

      this.value = this.checked;
    }

    //manager
    window.twpxSelectManager.add(this);
  }

  set onChange(fn) {
    this.customOnChange = fn;
  }

  get value() {
    return this.hidden.value;
  }

  set value(val) {
    if (val === undefined) return;

    const valObj = this.optionsArray.find((obj) => obj.code === val);
    this.content.textContent = `${valObj ? valObj.name : ''}`;
    this.hidden.value = val;
    if (val) {
      this.selectDiv.classList.add('twpx-select--selected');
    } else {
      this.selectDiv.classList.remove('twpx-select--selected');
    }
  }

  set disabled(val) {
    if (val) {
      this.selectDiv.classList.add('twpx-select--disabled');
      this.selectDiv.classList.remove('twpx-select--selected');
    } else {
      this.selectDiv.classList.remove('twpx-select--disabled');
    }
  }

  get name() {
    return this.hidden.getAttribute('name');
  }

  set options(options) {
    this.dropdown.innerHTML = options;
  }

  //methods
  isOption(val) {
    return this.optionsArray.find((obj) => obj.code === val) ? true : false;
  }

  prepend(element) {
    //prepend before the hidden input
    if (typeof element === 'string') {
      this.selectDiv.querySelector('.twpx-select__prepend').innerHTML = element;
    } else {
      //node
      this.selectDiv
        .querySelector('.twpx-select__prepend')
        .appendChild(element);
    }
  }

  recreate({ options, val, hidePrepend }) {
    // const id = this.selectDiv.getAttribute('id'),
    //   name = this.hidden.getAttribute('name'),
    //   value = val || this.hidden.value,
    //   label = this.selectDiv
    //     .querySelector('.twpx-select__label')
    //     .textContent.trim(),
    //   prependContent = this.selectDiv.querySelector(
    //     '.twpx-select__prepend'
    //   ).innerHTML;
    //this.createSelectDiv(id, name, value, label, optionsArr, prependContent);

    this.createOptionsArray(options || []);
    this.options = this.createOptions();

    this.value = `${val ? val : ''}`;

    this.selectDiv.querySelector('.twpx-select__prepend').style.display = `${
      hidePrepend ? 'none' : 'block'
    }`;
  }

  createOptionsArray(optionsArr) {
    if (optionsArr) {
      this.optionsArray = optionsArr.slice(0);
    } else if (this.select.tagName.toLowerCase() === 'select') {
      this.optionsArray = [];
      this.select.querySelectorAll('option').forEach((option) => {
        this.optionsArray.push(createOption(option));
      });
    } else if (
      this.select.tagName.toLowerCase() === 'div' &&
      this.select.classList.contains('twpx-select')
    ) {
      this.optionsArray = [];
      this.dropdown
        .querySelectorAll('.twpx-select__dropdown-item')
        .forEach((item) => {
          this.optionsArray.push(createOption(item));
        });
    }

    function createOption(option) {
      const attributes = option.attributes;
      const attr = [];

      for (let key in attributes) {
        if (attributes[key].nodeName && attributes[key].nodeName !== 'value') {
          attr.push({
            name: attributes[key].nodeName,
            value: attributes[key].nodeValue,
          });
        }
      }

      return {
        code: option.getAttribute('data-value') || option.getAttribute('value'),
        name: option.textContent.trim(),
        attributes: attr,
      };
    }
  }

  createOptions(optionsArr) {
    optionsArr = optionsArr || this.optionsArray;
    let selectOptions = '';

    optionsArr.forEach((option) => {
      let attributes = '';
      if (option.attributes && option.attributes.length > 0) {
        option.attributes.forEach((attr) => {
          attributes += ` ${attr.name}="${attr.value}"`;
        });
      }
      if (option.code && option.name) {
        selectOptions += `<div class="twpx-select__dropdown-item" data-value="${option.code}"${attributes}>${option.name}</div>`;
      }
    });

    return selectOptions;
  }

  clickItem(item) {
    this.content.textContent = item.textContent;
    this.hidden.value = item.getAttribute('data-value');
    this.selectDiv.classList.add('twpx-select--selected');
    this.hideDropdown();
    //onchange
    if (typeof this.customOnChange === 'function') {
      this.customOnChange();
    }
  }

  openDropdown() {
    if (window.twpxSelectManager) {
      Object.values(window.twpxSelectManager.selectObject).forEach((select) => {
        select.hideDropdown();
      });
    }
    this.selectDiv.classList.add('twpx-select--dropdown');
  }

  hideDropdown() {
    if (this.selectDiv.classList.contains('twpx-select--dropdown')) {
      this.selectDiv.classList.remove('twpx-select--dropdown');
      this.selectDiv.classList.add('twpx-select--animate');
      setTimeout(() => {
        this.selectDiv.classList.remove('twpx-select--animate');
      }, 200);
    }
  }

  createSelectDiv(id, name, value, label, optionsArr, prependContent) {
    this.selectDiv.classList.add('twpx-select');

    if (id || this.select.getAttribute('id')) {
      this.selectDiv.setAttribute('id', id || this.select.getAttribute('id'));
    }

    let selectName = name || this.select.getAttribute('name'),
      selectValue = value || this.select.value,
      selectOptions = '',
      selectLabel = label || this.label.textContent.trim(),
      selectedOption = this.optionsArray.find(
        (obj) => obj.code === selectValue
      ),
      text = selectedOption ? selectedOption.name : '';

    if (text) {
      this.selectDiv.classList.add('twpx-select--selected');
    }
    if (this.isDisabled) {
      this.selectDiv.classList.add('twpx-select--disabled');
    }

    optionsArr = optionsArr || this.optionsArray;

    optionsArr.forEach((option) => {
      let attributes = '';
      if (option.attributes && option.attributes.length > 0) {
        option.attributes.forEach((attr) => {
          attributes += ` ${attr.name}="${attr.value}"`;
        });
      }
      if (option.code && option.name) {
        selectOptions += `<div class="twpx-select__dropdown-item" data-value="${option.code}"${attributes}>${option.name}</div>`;
      }
    });

    const html = `
      <div class="twpx-select__prepend">${
        prependContent ? prependContent : ''
      }</div>
      <input type="hidden" name="${selectName}" value="${selectValue}" />
      <div class="twpx-select__arrow">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="16"
          viewBox="0 0 18 16"
        >
          <g transform="translate(17.589 16) rotate(180)">
            <ellipse
              cx="9"
              cy="8"
              rx="9"
              ry="8"
              transform="translate(-0.411)"
              fill="#fff"
            />
            <path
              d="M3.822,0a.57.57,0,0,0-.386.147L.16,3.157a.473.473,0,0,0,0,.709.581.581,0,0,0,.772,0l2.89-2.655,2.89,2.655a.581.581,0,0,0,.772,0,.473.473,0,0,0,0-.709L4.208.147A.57.57,0,0,0,3.822,0Z"
              transform="translate(4.855 5.23)"
            />
          </g>
        </svg>
      </div>
      <div class="twpx-select__label">${selectLabel}</div>
      <div class="twpx-select__content">${text}</div>
      <div class="twpx-select__dropdown">${selectOptions}</div>
    `;

    this.selectDiv.innerHTML = html;

    if (this.control && this.select) {
      this.control.innerHTML = '';
      this.control.appendChild(this.selectDiv);
    }

    this.divElements();
    this.divEvents();
  }

  divElements() {
    this.content = this.selectDiv.querySelector('.twpx-select__content');
    this.dropdown = this.selectDiv.querySelector('.twpx-select__dropdown');
    this.hidden = this.selectDiv.querySelector('input[type="hidden"]');
  }

  divEvents() {
    this.content.addEventListener('click', () => {
      if (this.selectDiv.classList.contains('twpx-select--dropdown')) {
        this.hideDropdown();
      } else {
        this.openDropdown();
      }
    });

    this.dropdown.addEventListener('click', (e) => {
      if (e.target.classList.contains('twpx-select__dropdown-item')) {
        this.clickItem(e.target);
      }
    });
  }
}
