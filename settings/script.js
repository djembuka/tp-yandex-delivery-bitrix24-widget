window.addEventListener('DOMContentLoaded', () => {
  //twpx select
  document.querySelectorAll('select').forEach((select) => {
    const form = select.closest('form');
    new twpxSelect({
      select,
      onChange() {
        autosave(form);
      },
    });
  });
  //settings
  document.querySelectorAll('.twpx-ydw-settings').forEach((settingsBlock) => {
    let storageArray = [];

    //ymaps api
    (() => {
      const key = String(twinpxYadeliverySettingsApiKeyInput.value).trim();
      if (key !== '') {
        appendYmapsScript(key);
      }
    })();

    //menu
    (() => {
      const menu = settingsBlock.querySelector('.twpx-ydw-settings-menu');
      const menuItems = menu.querySelectorAll('.twpx-ydw-settings-menu-item');
      const tabs = settingsBlock.querySelectorAll('.twpx-ydw-settings-tab');

      //page loaded
      (() => {
        const menuItemActive = menu.querySelector(
          '.twpx-ydw-settings-menu-item--active'
        );
        const tabActiveCode = menuItemActive.getAttribute('data-tab');
        const tabActive = settingsBlock.querySelector(
          `.twpx-ydw-settings-tab[data-tab="${tabActiveCode}"]`
        );
        tabActive.classList.add('twpx-ydw-settings-tab--active');
      })();

      menuItems.forEach((item) => {
        item.addEventListener('click', (e) => {
          e.preventDefault();

          //set active
          menuItems.forEach((i) => {
            i.classList.remove('twpx-ydw-settings-menu-item--active');
          });

          item.classList.add('twpx-ydw-settings-menu-item--active');

          //tab
          const tabCode = item.getAttribute('data-tab');
          const tab = settingsBlock.querySelector(
            `.twpx-ydw-settings-tab[data-tab="${tabCode}"]`
          );

          tabs.forEach((tab) => {
            tab.classList.remove('twpx-ydw-settings-tab--active');
          });
          tab.classList.add('twpx-ydw-settings-tab--active');

          //fit window
          window.twinpxIframeContentSize = BX24.getScrollSize();
          BX24.fitWindow();
        });
      });
    })();

    //common elements
    (() => {
      //input, select
      settingsBlock
        .querySelectorAll('.twpx-ydw-settings-form-control')
        .forEach((block) => {
          let input = block.querySelector('input');
          let select = block.querySelector('select');

          if (input) {
            inputEvents(input, block, settingsBlock);
          } else if (select) {
            selectEvents(select, block);
          }
        });
    })();

    //create storages on page load
    (() => {
      createStorageArray(true);
      createStorageNameSelectInput();
    })();

    //settings tab
    (() => {
      //settings button
      const settingsButton = settingsBlock.querySelector(
        '#twinpxYadeliverySettingsButton'
      );

      const errorBlock = settingsBlock.querySelector(
        '.twpx-ydw-settings-error'
      );

      const successBlock = settingsBlock.querySelector(
        '.twpx-ydw-settings-success'
      );

      settingsButton.addEventListener('click', async (e) => {
        e.preventDefault();

        settingsButton.classList.add('twpx-ydw-settings-button--loading');

        let formData = new FormData(settingsButton.closest('form')),
          controller = new AbortController(),
          response,
          result;

        formData.set('action', 'checkConnection');

        setTimeout(() => {
          if (!response) {
            controller.abort();
          }
        }, 20000);

        try {
          response = await fetch(settingsButton.getAttribute('data-url'), {
            method: 'POST',
            body: formData,
            signal: controller.signal,
          });

          result = await response.json();

          settingsButton.classList.remove('twpx-ydw-settings-button--loading');

          if (result && typeof result === 'object') {
            if (result.status === 'success') {
              if (result.errors) {
                errorBlock.classList.add('twpx-ydw-settings-error--show');
                successBlock.classList.remove(
                  'twpx-ydw-settings-success--show'
                );
                errorBlock.querySelector(
                  '.twpx-ydw-settings-error-content'
                ).innerHTML = result.errors[0].message;
              } else if (result.data && result.data.message) {
                successBlock.classList.add('twpx-ydw-settings-success--show');
                errorBlock.classList.remove('twpx-ydw-settings-error--show');
                successBlock.querySelector(
                  '.twpx-ydw-settings-success-content'
                ).innerHTML = result.data.message;
              }
            } else {
            }
          }
        } catch (err) {
          throw err;
        }
      });

      //map
      document
        .querySelector('.twpx-ydw-settings-map')
        .addEventListener('click', (e) => {
          e.preventDefault();
        });

      //add button
      settingsBlock
        .querySelectorAll('.twpx-ydw-settings-add-button')
        .forEach((addButton) => {
          const group = addButton.closest('.twpx-ydw-settings-form-group');

          addButton.addEventListener('click', (e) => {
            e.preventDefault();

            const newBlock = group
              .querySelector('.twpx-ydw-settings-form-control')
              .cloneNode(true);
            const newControl = newBlock.querySelector(
              '.twpx-ydw-settings-input'
            );
            const newHidden = newBlock.querySelector('input[type="hidden"]');

            newBlock.classList.remove('twpx-ydw-settings-form-control--active');
            newBlock.classList.remove(
              'twpx-ydw-settings-form-control--invalid'
            );
            newControl.value
              ? (newControl.value = '')
              : (newControl.textContent = '');
            if (newHidden) {
              newHidden.value = '';
            }

            addButton.before(newBlock);

            inputEvents(newControl, newBlock);

            if (
              group.querySelectorAll('.twpx-ydw-settings-form-control').length >
              1
            ) {
              group.classList.add('twpx-ydw-settings-form-group--multiple');
            } else {
              group.classList.remove('twpx-ydw-settings-form-group--multiple');
            }

            //fit window
            window.twinpxIframeContentSize = BX24.getScrollSize();
            BX24.fitWindow();
          });
        });
    })();

    function selectEvents(select, block) {
      if (select.value.trim() !== '') {
        block.classList.add('twpx-ydw-settings-form-control--active');
      }

      select.addEventListener('change', () => {
        if (select.value.trim() !== '') {
          block.classList.add('twpx-ydw-settings-form-control--active');
        } else {
          block.classList.remove('twpx-ydw-settings-form-control--active');
        }

        //storage
        if (
          select.closest('.twpx-ydw-settings-form-group').parentNode.id ===
          'twinpxYadeliveryStorageName'
        ) {
          const name = storageArray.find((obj) => obj.id === select.value).name;
          const input = select
            .closest('.twpx-ydw-settings-form-group')
            .querySelector(`.twpx-ydw-settings-input`);
          input.value = name;

          if (name === '') {
            input
              .closest('.twpx-ydw-settings-form-control')
              .classList.remove('twpx-ydw-settings-form-control--active');
          } else {
            input
              .closest('.twpx-ydw-settings-form-control')
              .classList.add('twpx-ydw-settings-form-control--active');
          }
        }

        autosave(select.closest('form'));
      });
    }

    function inputEvents(control, block) {
      if (control.value && control.value.trim() !== '') {
        block.classList.add('twpx-ydw-settings-form-control--active');
      }

      control.addEventListener('focus', () => {
        block.classList.add('twpx-ydw-settings-form-control--active');
      });

      control.addEventListener('blur', () => {
        if (control.value.trim() !== '') {
          block.classList.add('twpx-ydw-settings-form-control--active');

          if (control.id === 'twinpxYadeliverySettingsApiKeyInput') {
            appendYmapsScript(String(control.value).trim());
          }
        } else {
          block.classList.remove('twpx-ydw-settings-form-control--active');
        }

        autosave(control.closest('form'));
      });

      control.addEventListener('keyup', (e) => {
        if (
          control.closest('.twpx-ydw-settings-form-group').parentNode.id ===
          'twinpxYadeliveryStorageName'
        ) {
          onStorageInputKeyup(control);
        }
      });

      //storages
      if (
        control.closest('.twpx-ydw-settings-form-group').id ===
        'twinpxYadeliveryStorageID'
      ) {
        control.addEventListener('change', onStorageSelectChange);
      }

      function onStorageSelectChange() {
        createStorageArray();
        createStorageNameSelectInput();
      }

      function onStorageInputKeyup(control) {
        const c = control
          .closest('.twpx-ydw-settings-form-group')
          .querySelector('.twpx-ydw-settings-input');

        const id =
          c.tagName.toLowerCase() === 'input'
            ? c.value.trim()
            : c.textContent.trim();

        storageArray.find((obj) => obj.id === id).name = control.value.trim();
      }

      //remove
      const removeButton = block.querySelector('.twpx-ydw-settings-btn-remove');

      if (removeButton) {
        removeButton.addEventListener('click', (e) => {
          e.preventDefault();

          const group = block.closest('.twpx-ydw-settings-form-group');

          block.remove();

          if (
            group.querySelectorAll('.twpx-ydw-settings-form-control').length > 1
          ) {
            group.classList.add('twpx-ydw-settings-form-group--multiple');
          } else {
            group.classList.remove('twpx-ydw-settings-form-group--multiple');
          }

          //storages
          if (group.id === 'twinpxYadeliveryStorageID') {
            onStorageSelectChange();
          }

          autosave(group.closest('form'));

          //fit window
          window.twinpxIframeContentSize = BX24.getScrollSize();
          BX24.fitWindow();
        });
      }

      //list
      const listButton = block.querySelector('.twpx-ydw-settings-btn-list');

      if (listButton) {
        listButton.addEventListener('click', (e) => {
          e.preventDefault();

          const input = listButton
            .closest('.twpx-ydw-settings-form-control')
            .querySelector('.twpx-ydw-settings-input');

          const hiddenInput = listButton
            .closest('.twpx-ydw-settings-form-control')
            .querySelector('input[type="hidden"]');

          const json =
            hiddenInput.value.trim() !== ''
              ? JSON.parse(hiddenInput.value)
              : {};

          input.setAttribute('data-active', true);

          if (input.value.trim() !== '') {
            //open map
            document.dispatchEvent(
              new CustomEvent('twpxYdwInitMap', {
                detail: json,
              })
            );
          } else {
            //open location
            document.dispatchEvent(new CustomEvent('twpxYdwInitLocation'));
          }
        });
      }

      //clear
      const clearButton = block.querySelector('.twpx-ydw-settings-btn-clear');

      if (clearButton) {
        clearButton.addEventListener('click', (e) => {
          e.preventDefault();
          console.log('fff');

          if (control.value) {
            control.value = '';
          } else if (control.textContent) {
            control.textContent = '';
          }

          const hidden = control.parentNode.querySelector(
            'input[type="hidden"]'
          );
          if (hidden) {
            hidden.value = '';
          }

          const div = control.parentNode.querySelector(
            'div.twpx-ydw-settings-input'
          );
          if (div) {
            div.textContent = '';
          }

          control
            .closest('.twpx-ydw-settings-form-control ')
            .classList.remove('twpx-ydw-settings-form-control--active');

          autosave(control.closest('form'));
        });
      }
    }

    function createStorageNameSelectInput() {
      let html = '';
      const storageNameBlock = document.getElementById(
        'twinpxYadeliveryStorageName'
      );

      storageArray.forEach((storageObj) => {
        html += `
          <div class="twpx-ydw-settings-form-group">
            <div class="twpx-ydw-settings-form-wrapper">
              <div
                class="twpx-ydw-settings-form-control twpx-ydw-settings-form-control--disabled twpx-ydw-settings-form-control--active"
              >
                <div class="twpx-ydw-settings-label">ID склада</div>
                <input type="text" value="${
                  storageObj.id || ''
                }" disabled="disabled" class="twpx-ydw-settings-input" >
              </div>
            </div>
            <div class="twpx-ydw-settings-form-wrapper">
              <div class="twpx-ydw-settings-form-control">
                <div class="twpx-ydw-settings-label">Название склада</div>
                <input
                  type="text"
                  name="STORAGE_NAME[]"
                  value="${storageObj.name || ''}"
                  class="twpx-ydw-settings-input"
                />
              </div>
            </div>
          </div>`;
      });

      storageNameBlock.innerHTML = html;

      //input events
      storageNameBlock
        .querySelectorAll('.twpx-ydw-settings-input')
        .forEach((input) => {
          inputEvents(input, input.closest('.twpx-ydw-settings-form-control'));
        });
    }

    function createStorageArray(pageLoadFlag) {
      const newStorageArray = [];

      document
        .querySelectorAll('#twinpxYadeliveryStorageID .twpx-ydw-settings-input')
        .forEach((input, index) => {
          let value = input.value.trim();
          if (value !== '') {
            let name;
            try {
              if (pageLoadFlag) {
                name = document.querySelectorAll(
                  '#twinpxYadeliveryStorageName .twpx-ydw-settings-input'
                )[index].value;
              } else {
                name = storageArray.find((obj) => obj.id === value).name;
              }
            } catch (e) {}

            newStorageArray.push({
              id: value,
              name: name || '',
            });
          }
        });

      storageArray = newStorageArray.slice(0); //clone
    }

    //init location
    document.addEventListener('twpxYdwInitLocation', () => {
      if (window.BX24) {
        BX24.resizeWindow(
          window.twinpxIframeInitialSize.width,
          window.twinpxIframeInitialSize.height
        );
      }

      document
        .querySelector('body')
        .classList.add('twpx-ydw-settings--no-scroll');

      //loader
      document
        .querySelector('#location-widget')
        .classList.add('location-widget--loader');

      //show location
      settingsBlock.classList.add('twpx-ydw-settings--location');

      let error =
        twinpxYadeliverySettingsTokenInput.value.trim() === ''
          ? window.twinpxYadeliveryErrors.emptyToken
          : twinpxYadeliverySettingsApiKeyInput.value.trim() === ''
          ? window.twinpxYadeliveryErrors.emptyApiKey
          : '';

      (function (w) {
        function startWidget() {
          w.twpxYadeliveryLocation.createWidget(
            {
              containerId: 'location-widget',
              params: {
                error,
              },
              fetchLocationURL: {
                html: window.twinpxYadeliveryLocationLoad,
                css: window.twinpxYadeliveryLoacationWidget.css,
                js: window.twinpxYadeliveryLoacationWidget.js,
              },
            },
            () => {
              document
                .querySelector('#location-widget')
                .classList.remove('location-widget--loader');
            }
          );
        }
        w.twpxYadeliveryLocation
          ? startWidget()
          : document.addEventListener(
              'twpxYadeliveryLocationLoad',
              startWidget
            );
      })(window);
    });

    //choose location
    document.addEventListener('twpxYdwLocationChosen', (e) => {
      document.dispatchEvent(new CustomEvent('twpxYdwCloseLocation'));
      document.dispatchEvent(
        new CustomEvent('twpxYdwInitMap', {
          detail: { location: e.detail },
        })
      );
    });

    //close location
    document.addEventListener('twpxYdwCloseLocation', () => {
      if (window.BX24) {
        BX24.resizeWindow(
          window.twinpxIframeContentSize.scrollWidth,
          window.twinpxIframeContentSize.scrollHeight
        );
      }

      settingsBlock.classList.remove('twpx-ydw-settings--location');

      document
        .querySelector('body')
        .classList.remove('twpx-ydw-settings--no-scroll');
    });

    //init map
    document.addEventListener('twpxYdwInitMap', ({ detail }) => {
      if (window.BX24) {
        BX24.resizeWindow(
          window.twinpxIframeInitialSize.width,
          window.twinpxIframeInitialSize.height
        );
      }

      document
        .querySelector('body')
        .classList.add('twpx-ydw-settings--no-scroll');

      //loader
      document
        .querySelector('#yadelivery-widget')
        .classList.add('yadelivery-widget--loader');

      //show map
      settingsBlock.classList.add('twpx-ydw-settings--map');

      let error =
          twinpxYadeliverySettingsTokenInput.value.trim() === ''
            ? window.twinpxYadeliveryErrors.emptyToken
            : twinpxYadeliverySettingsApiKeyInput.value.trim() === ''
            ? window.twinpxYadeliveryErrors.emptyApiKey
            : '',
        panTo = detail.coords,
        city = detail.location,
        id = detail.id;

      (function (w) {
        function startWidget() {
          w.twpxYadeliveryWidget.createWidget(
            {
              containerId: 'yadelivery-widget',
              params: {
                error,
                panTo,
                city,
                id,
              },
            },
            () => {
              document
                .querySelector('#yadelivery-widget')
                .classList.remove('yadelivery-widget--loader');
            }
          );
        }
        w.twpxYadeliveryWidget
          ? setTimeout(startWidget, 500)
          : document.addEventListener('twpxYadeliveryWidgetLoad', startWidget);
      })(window);
    });

    //choose terminal
    document.addEventListener('twpxYdwTerminalChosen', (e) => {
      const terminalFormBlock = document.getElementById(
        'twpxYdwTerminalFormBlock'
      );

      if (terminalFormBlock) {
        //value
        const activeInput = terminalFormBlock.querySelector(
          '.twpx-ydw-settings-input[data-active="true"]'
        );

        if (!activeInput) return;

        const activeHiddenInput = activeInput.parentNode.querySelector(
          'input[type="hidden"]'
        );
        setInputValue(activeInput, `${e.detail.title} (${e.detail.address})`);
        activeHiddenInput.value = JSON.stringify(e.detail);

        autosave(terminalFormBlock.closest('form'));

        //close map
        document.dispatchEvent(new CustomEvent('twpxYdwCloseMap'));
      }
    });

    //close map
    document.addEventListener('twpxYdwCloseMap', () => {
      if (window.BX24) {
        BX24.resizeWindow(
          window.twinpxIframeContentSize.scrollWidth,
          window.twinpxIframeContentSize.scrollHeight
        );
      }

      const terminalFormBlock = document.getElementById(
        'twpxYdwTerminalFormBlock'
      );

      if (terminalFormBlock) {
        const activeInput = terminalFormBlock.querySelector(
          '.twpx-ydw-settings-input[data-active="true"]'
        );
        activeInput.removeAttribute('data-active');
      }

      settingsBlock.classList.remove('twpx-ydw-settings--map');

      document
        .querySelector('body')
        .classList.remove('twpx-ydw-settings--no-scroll');
    });

    function setInputValue(input, value) {
      const block = input.closest('.twpx-ydw-settings-form-control');
      input.value !== undefined
        ? (input.value = value)
        : (input.textContent = value);

      if (value.trim() !== '') {
        block.classList.add('twpx-ydw-settings-form-control--active');
      } else {
        block.classList.remove('twpx-ydw-settings-form-control--active');
      }
    }

    function appendYmapsScript(key) {
      let s = document.createElement('script');
      s.src = `//api-maps.yandex.ru/2.1.50/?apikey=${key}&load=package.full&lang=ru-RU`;
      document.querySelector('body').append(s);
    }
  });

  async function autosave(form, cnt, del_id) {
    let counter = cnt || 0;

    //send request
    let formData = new FormData(form),
      controller = new AbortController(),
      response,
      result;

    formData.set('del_fieldset_id', del_id);

    setTimeout(() => {
      if (!response) {
        controller.abort();
      }
    }, 20000);

    try {
      response = await fetch(form.getAttribute('data-autosave'), {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });

      result = await response.json();

      if (result && typeof result === 'object') {
        if (result.status === 'success') {
          if (typeof result.data.date === 'string') {
            form
              .querySelectorAll('.twpx-ydw-settings-saved-info')
              .forEach((infoBlock) => {
                infoBlock.textContent = result.data.date;
              });
          }
        } else if (counter < 3) {
          autosave(form, ++counter);
        } else if (result.errors) {
          console.log(result.errors[0].message);
        }
      }
    } catch (err) {
      throw err;
    }
  }
});

window.addEventListener('load', () => {
  if (window.BX24) {
    BX24.init(() => {
      window.twinpxIframeInitialSize = {
        width: document.documentElement.clientWidth,
        height: document.documentElement.clientHeight,
      };
      window.twinpxIframeContentSize = BX24.getScrollSize();
      BX24.fitWindow();
    });
  }
});
