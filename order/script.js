window.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.twpx-ydw-order').forEach((orderBlock) => {
    const orderForm = orderBlock.querySelector('#twinpxYadeliveryOrderForm');
    const boxesBlock = orderBlock.querySelector('#twinpxYadeliveryBoxes');
    const productsBlock = orderBlock.querySelector('#twinpxYadeliveryProducts');
    const periodBlock = orderBlock.querySelector('#twinpxYadeliveryPeriod');
    const periodButton = periodBlock
      .querySelector('#twinpxYadeliveryPeriodButton')
      .cloneNode();
    const orderButtonBlock = orderBlock.querySelector(
      '.twpx-ydw-order-button-block'
    );
    const orderButton = orderButtonBlock.querySelector(
      '#twinpxYadeliveryOrderButton'
    );
    const errorBlock = document.querySelector('.twpx-ydw-order-error--fixed');
    let twpxYdwTerminalPayment = [];
    let isFormValid = true;
    let listButtonYCoords = 0;
    const storage = {
      boxes: {
        id: null,
        value: {
          checked: null,
          customSize: {},
        },
      },
      from: {
        id: null,
        value: {},
      },
    };

    //storage
    if (window.BX24) {
      BX24.callMethod('entity.get', {}, (result) => {
        if (result.error()) {
          // console.error(result.error());
          onBX24Methods();
        } else {
          let storageEntitiesArray = result.data();

          if (!storageEntitiesArray.length) {
            BX24.callMethod(
              'entity.add',
              {
                ENTITY: 'twpx_ydw',
                NAME: 'Twin px Yandex delivery widget storage',
              },
              (res) => {
                if (res.error()) {
                  // console.error(res.error());
                  onBX24Methods();
                } else {
                  addEntityItems(Object.keys(storage), onBX24Methods);
                }
              }
            );
          } else {
            BX24.callMethod(
              'entity.item.get',
              {
                ENTITY: 'twpx_ydw',
              },
              (res) => {
                if (res.error()) {
                  // console.error(res.error());
                  onBX24Methods();
                } else {
                  const storageItemsArray = res.data();
                  const codesToAdd = [];

                  Object.keys(storage).forEach((code) => {
                    let item = storageItemsArray.find((i) => i.CODE === code);
                    if (item) {
                      storage[code].id = item.ID;
                      if (item.DETAIL_TEXT) {
                        storage[code].value = JSON.parse(item.DETAIL_TEXT);
                      }
                    } else {
                      codesToAdd.push(code);
                    }
                  });

                  if (!codesToAdd.length) {
                    onBX24Methods();
                  } else {
                    addEntityItems(codesToAdd, onBX24Methods);
                  }
                }
              }
            );
          }
        }
      });
    } else {
      onBX24Methods();
    }

    function addEntityItems(codesArray, callback) {
      codesArray.forEach((code, i) => {
        BX24.callMethod(
          'entity.item.add',
          {
            ENTITY: 'twpx_ydw',
            NAME: code,
            CODE: code,
            DETAIL_TEXT: '',
          },
          (r) => {
            if (r.error()) {
              // console.error(r.error());
              if (i === codesArray.length - 1) {
                callback();
              }
            } else {
              storage[code].id = r.data();
              if (i === codesArray.length - 1) {
                callback();
              }
            }
          }
        );
      });
    }

    function onBX24Methods() {
      //on page load
      (() => {
        //twpx select
        document.querySelectorAll('select').forEach((select) => {
          new twpxSelect({
            select,
            onChange() {
              //validate form
              setTimeout(() => {
                validateForm();
                disabledPeriodSelects();
                setOrderButtonActive();
                fitWindow();
              }, 500);
            },
          });
        });

        //from block
        const fromBlock = orderBlock.querySelector('#twinpxYadeliveryFrom');

        //switcher
        (() => {
          const fromSwitcher = fromBlock.querySelector(
            '.twpx-ydw-order-switcher'
          );

          const fromSwitcherName = fromSwitcher
            .querySelector('[type="radio"]')
            .getAttribute('name');

          const value = storage.from.value[fromSwitcherName];

          let checkedRadio;

          if (value) {
            checkedRadio = fromSwitcher.querySelector(
              `input[value="${value}"]`
            );
          }

          if (
            !checkedRadio ||
            checkedRadio.getAttribute('disabled') === 'disabled'
          ) {
            checkedRadio = fromSwitcher.querySelector(
              `input[checked='checked']`
            );
          }

          if (checkedRadio) {
            checkedRadio.checked = 'checked';
            const checkedItem = fromSwitcher.querySelector(
              `[data-value="${checkedRadio.value}"]`
            );
            animateSwitcher(fromSwitcher, checkedItem, checkedRadio.value);
          }
        })();

        //from block select
        (() => {
          fromBlock.querySelectorAll('select').forEach((select) => {
            const selectName = select.getAttribute('name');
            let value;

            if (storage.from.value[selectName]) {
              select.querySelectorAll('option').forEach((option) => {
                if (
                  option.getAttribute('value') ===
                  storage.from.value[selectName]
                ) {
                  value = storage.from.value[selectName];
                }
              });

              if (value) {
                select.value = value;
              } else {
                storage.from.value = {};
                setBX24Storage(
                  storage.from.id,
                  JSON.stringify(storage.from.value)
                );
              }
            }
          });
          fromBlock.querySelectorAll('.twpx-select').forEach((selectDiv) => {
            const twpxSelect =
              window.twpxSelectManager.selectObject[
                selectDiv.getAttribute('data-id')
              ];
            const twpxSelectName = twpxSelect.name;
            let value;
            if (storage.from.value[twpxSelectName]) {
              if (twpxSelect.isOption(storage.from.value[twpxSelectName])) {
                value = storage.from.value[twpxSelectName];
              }

              if (value) {
                twpxSelect.value = value;
              } else {
                storage.from.value = {};
                setBX24Storage(
                  storage.from.id,
                  JSON.stringify(storage.from.value)
                );
              }
            }
          });
        })();

        //payment select
        (() => {
          const twpxPaymentSelect =
            window.twpxSelectManager.selectObject[
              orderBlock
                .querySelector('#twpxYdwPaymentSelect')
                .getAttribute('data-id')
            ];

          if (twpxPaymentSelect.value === 'already_paid') {
            orderBlock.querySelector('#twpxYdwPaymentInput').style.display =
              'none';
          }
        })();

        //other switchers
        orderBlock
          .querySelectorAll('.twpx-ydw-order-switcher')
          .forEach((switcher) => {
            //checked
            const checked = switcher.querySelector(`input:checked`);
            if (checked) {
              const value = checked.value;
              const clicked = switcher.querySelector(
                `.twpx-ydw-order-switcher-item[data-value="${value}"]`
              );

              animateSwitcher(switcher, clicked, value);
            }

            //disabled
            switcher
              .querySelectorAll(`input[disabled="disabled"]`)
              .forEach((radio) => {
                const value = radio.value;
                const disabled = switcher.querySelector(
                  `.twpx-ydw-order-switcher-item[data-value="${value}"]`
                );
                disabled.classList.add(
                  'twpx-ydw-order-switcher-item--disabled'
                );
              });
          });

        fitWindow();
      })();

      function fitWindow() {
        if (window.BX24) {
          if (!window.twinpxIframeInitialSize) {
            window.twinpxIframeInitialSize = {
              width: document.documentElement.clientWidth,
              height: document.documentElement.clientHeight,
            };
          }
          BX24.fitWindow();
          window.twinpxIframeContentSize = BX24.getScrollSize();
        }
      }

      function validateForm(showInvalidFlag, focusFirstFlag) {
        //validate form
        isFormValid = true;
        document
          .querySelectorAll('[required="required"]')
          .forEach((control) => {
            if (control.clientWidth > 0 && control.value.trim() === '') {
              if (showInvalidFlag) {
                control
                  .closest('.twpx-ydw-order-form-control')
                  .classList.add('twpx-ydw-order-form-control--invalid');
              }
              if (focusFirstFlag && isFormValid) {
                // window.scrollTo({
                //   top:
                //     control.getBoundingClientRect().top + window.scrollY - 100,
                //   behavior: 'smooth',
                // });
                // setTimeout(() => {
                control.focus();
                // }, 600);
              }
              isFormValid = false;
            }
          });
      }

      function disabledPeriodSelects() {
        const dateTwpxSelect =
          window.twpxSelectManager.selectObject[
            document
              .getElementById('twinpxYadeliveryDateSelect')
              .getAttribute('data-id')
          ];
        const timeTwpxSelect =
          window.twpxSelectManager.selectObject[
            document
              .getElementById('twinpxYadeliveryTimeSelect')
              .getAttribute('data-id')
          ];
        if (isFormValid === true) {
          periodBlock.classList.remove('twpx-period-disabled');
          orderButtonBlock.classList.remove('twpx-button-disabled');
          dateTwpxSelect.disabled = false;
          dateTwpxSelect.recreate({});
          timeTwpxSelect.disabled = false;
          timeTwpxSelect.recreate({});
        } else {
          periodBlock.classList.add('twpx-period-disabled');
          orderButtonBlock.classList.add('twpx-button-disabled');
          dateTwpxSelect.disabled = true;
          dateTwpxSelect.recreate({});
          timeTwpxSelect.disabled = true;
          timeTwpxSelect.recreate({});
        }
      }

      //from select change event
      (() => {
        orderBlock
          .querySelectorAll('#twinpxYadeliveryFrom select')
          .forEach((select) => {
            select.addEventListener('change', () => {
              storage.from.value[select.getAttribute('name')] = select.value;
              setBX24Storage(
                storage.from.id,
                JSON.stringify(storage.from.value)
              );
            });
          });

        orderBlock
          .querySelectorAll('#twinpxYadeliveryFrom .twpx-select')
          .forEach((selectDiv) => {
            const twpxSelect =
              window.twpxSelectManager.selectObject[
                selectDiv.getAttribute('data-id')
              ];

            twpxSelect.onChange = () => {
              storage.from.value[twpxSelect.name] = twpxSelect.value;
              setBX24Storage(
                storage.from.id,
                JSON.stringify(storage.from.value)
              );
            };
          });
      })();

      //create default payment select
      const paymentSelect = orderBlock.querySelector('#twpxYdwPaymentSelect');
      let paymentArray = [];

      (() => {
        if (paymentSelect.tagName.toLowerCase() === 'select') {
          paymentSelect.querySelectorAll('option').forEach((option) => {
            paymentArray.push({
              code: option.getAttribute('value'),
              name: option.textContent.trim(),
            });
          });

          paymentSelect.addEventListener('change', () => {
            if (paymentSelect.value === 'already_paid') {
              orderBlock.querySelector('#twpxYdwPaymentInput').style.display =
                'none';
            } else {
              orderBlock.querySelector('#twpxYdwPaymentInput').style.display =
                'block';
            }
          });
        } else if (paymentSelect.tagName.toLowerCase() === 'div') {
          const paymentTwpxSelect =
            window.twpxSelectManager.selectObject[
              paymentSelect.getAttribute('data-id')
            ];

          paymentArray = paymentTwpxSelect.optionsArray.slice(0);

          paymentTwpxSelect.onChange = () => {
            if (paymentTwpxSelect.value === 'already_paid') {
              orderBlock.querySelector('#twpxYdwPaymentInput').style.display =
                'none';
            } else {
              orderBlock.querySelector('#twpxYdwPaymentInput').style.display =
                'block';
            }
            validateForm();
            disabledPeriodSelects();
            setOrderButtonActive();
            fitWindow();
          };
        }
      })();

      function createPaymentSelect(array) {
        if (!paymentArray || !paymentSelect) return;

        if (paymentSelect.tagName.toLowerCase() === 'select') {
          paymentSelect.innerHTML = '';

          paymentArray.forEach((paymentObject) => {
            if (
              !array ||
              array.find((element) => element === paymentObject.code)
            ) {
              const option = document.createElement('option');
              option.setAttribute('value', paymentObject.code);
              option.textContent = paymentObject.name;
              paymentSelect.append(option);
            }
          });

          orderBlock.querySelector('#twpxYdwPaymentInput').style.display =
            paymentSelect.value === 'already_paid' ? 'none' : 'block';
        } else if (paymentSelect.tagName.toLowerCase() === 'div') {
          const paymentTwpxSelect =
            window.twpxSelectManager.selectObject[
              paymentSelect.getAttribute('data-id')
            ];

          let arr = !array
            ? paymentArray
            : paymentArray.filter((paymentObject) =>
                array.find((element) => element === paymentObject.code)
              );

          paymentTwpxSelect.recreate({
            options: arr,
            val: arr.find((obj) => obj.code === paymentTwpxSelect.value)
              ? paymentTwpxSelect.value
              : arr[0].code,
          });

          orderBlock.querySelector('#twpxYdwPaymentInput').style.display =
            paymentTwpxSelect.value === 'already_paid' ? 'none' : 'block';
        }
      }

      //switcher
      orderBlock
        .querySelectorAll('.twpx-ydw-order-switcher')
        .forEach((switcher) => {
          //on click
          switcher.addEventListener('click', (e) => {
            const clicked = e.target;
            const value = clicked.getAttribute('data-value');

            if (!switcher.querySelector(`input[value="${value}"]`)) {
              return;
            }

            switcher.querySelector(`input[value="${value}"]`).checked =
              'checked';

            animateSwitcher(switcher, clicked, value);

            //from storage
            if (
              switcher
                .closest('.twpx-ydw-order-form-block')
                .getAttribute('id') === 'twinpxYadeliveryFrom'
            ) {
              const name = switcher
                .querySelector('[type="radio"]')
                .getAttribute('name');

              storage.from.value[name] = value;
              setBX24Storage(
                storage.from.id,
                JSON.stringify(storage.from.value)
              );
            }

            //where create payment
            if (
              switcher
                .closest('.twpx-ydw-order-form-block')
                .getAttribute('id') === 'twinpxYadeliveryWhere'
            ) {
              if (
                switcher.classList.contains(
                  'twpx-ydw-order-switcher--right-acitve'
                )
              ) {
                //terminal
                const terminalChosen =
                  orderBlock
                    .querySelector('#twpxYdwTerminalInput')
                    .value.trim() !== '';

                createPaymentSelect(
                  terminalChosen ? twpxYdwTerminalPayment : null
                );
              } else {
                //address
                createPaymentSelect();
              }
            }
          });
        });

      function animateSwitcher(switcher, clicked, value) {
        if (clicked.classList.contains('twpx-ydw-order-switcher-item--left')) {
          switcher.classList.remove('twpx-ydw-order-switcher--right-acitve');
        } else {
          switcher.classList.add('twpx-ydw-order-switcher--right-acitve');
        }

        //tabs
        switcher
          .closest('.twpx-ydw-order-form-group')
          .querySelectorAll(`.twpx-ydw-order-switcher-tab`)
          .forEach((tab) => {
            if (tab.getAttribute('data-type') === value) {
              tab.classList.add('twpx-ydw-order-switcher-tab--active');
            } else {
              tab.classList.remove('twpx-ydw-order-switcher-tab--active');
            }
          });

        //radio
        switcher.querySelector(`input[value="${value}"]`).checked = 'checked';

        //validate form
        setTimeout(() => {
          validateForm();
          disabledPeriodSelects();
          setOrderButtonActive();
          fitWindow();
        }, 500);
      }

      //input
      orderBlock
        .querySelectorAll('.twpx-ydw-order-form-control')
        .forEach((block) => {
          let control = block.querySelector('.twpx-ydw-order-input, textarea');
          if (control) {
            inputEvents(control, block);
          }
        });

      function inputEvents(control, block) {
        if (control.value && control.value.trim() !== '') {
          block.classList.add('twpx-ydw-order-form-control--active');
        }

        control.addEventListener('focus', () => {
          block.classList.add('twpx-ydw-order-form-control--active');
        });

        control.addEventListener('blur', () => {
          if (control.value.trim() !== '') {
            block.classList.add('twpx-ydw-order-form-control--active');
          } else {
            block.classList.remove('twpx-ydw-order-form-control--active');
          }
          //check required
          if (control.getAttribute('required')) {
            if (control.value.trim() === '') {
              block.classList.add('twpx-ydw-order-form-control--invalid');
              isFormValid = false;
            } else {
              block.classList.remove('twpx-ydw-order-form-control--invalid');
            }
            validateForm();
            disabledPeriodSelects();
            setOrderButtonActive();
          }
        });

        //this is not required, because we have document onclick
        //just to be sure
        control.addEventListener('keyup', () => {
          hideError();
        });

        //boxes custom
        if (
          control.closest('.twpx-ydw-order-form-block') &&
          control.closest('.twpx-ydw-order-form-block').id ===
            'twinpxYadeliveryBoxes'
        ) {
          control.addEventListener('keyup', (e) => {
            storage.boxes.value.customSize[control.getAttribute('data-name')] =
              control.value;
            setBX24Storage(
              storage.boxes.id,
              JSON.stringify(storage.boxes.value)
            );
          });
        }

        //list
        const listButton = block.querySelector(
          '.twpx-ydw-order-form-control--map .twpx-ydw-order-input'
        );

        if (listButton) {
          listButton.addEventListener('click', (e) => {
            e.preventDefault();
            listButtonYCoords = e.pageY;

            const input = listButton
              .closest('.twpx-ydw-order-form-control')
              .querySelector('.twpx-ydw-order-input');

            const hiddenInput = listButton
              .closest('.twpx-ydw-order-form-control')
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

        //calc
        const calcButton = block.querySelector('.twpx-ydw-order-btn-calc');

        if (calcButton) {
          const paymentInput = orderBlock.querySelector('#twpxYdwPaymentInput');

          calcButton.addEventListener('click', async (e) => {
            e.preventDefault();

            calcButton.classList.add('twpx-ydw-order-btn--loading');

            let formData = new FormData(orderForm),
              controller = new AbortController(),
              response,
              result;

            setTimeout(() => {
              if (!response) {
                controller.abort();
                showError(
                  'Connection aborted.',
                  block.closest('.twpx-ydw-order-form-block')
                );
              }
            }, 20000);

            try {
              response = await fetch(paymentInput.getAttribute('data-url'), {
                method: 'POST',
                body: formData,
                signal: controller.signal,
              });

              result = await response.json();

              calcButton.classList.remove('twpx-ydw-order-btn--loading');

              if (result && typeof result === 'object') {
                if (result.status === 'success') {
                  if (String(result.data.num)) {
                    setInputValue(
                      paymentInput.querySelector('input'),
                      result.data.num
                    );
                    paymentInput
                      .querySelector('input')
                      .dispatchEvent(new Event('blur'));
                  }
                } else if (result.errors) {
                  calcButton.classList.remove('twpx-ydw-order-btn--loading');

                  showError(
                    result.errors[0].message,
                    block.closest('.twpx-ydw-order-form-block')
                  );
                }
              }
            } catch (err) {
              calcButton.classList.remove('twpx-ydw-order-btn--loading');

              showError(err, block.closest('.twpx-ydw-order-form-block'));
            }
          });
        }

        //close
        const closeButton = block.querySelector('.twpx-ydw-order-form-close');

        if (closeButton) {
          closeButton.addEventListener('click', async (e) => {
            e.preventDefault();

            setInputValue(control, '');

            const hidden =
              control.parentNode.querySelector('input[type=hidden]');
            hidden.value = '';

            const textDiv = control.parentNode.querySelector(
              '.twpx-ydw-order-form-control-text'
            );
            if (textDiv) {
              textDiv.style.display = 'none';
              textDiv.textContent = '';
            }

            validateForm();
            disabledPeriodSelects();
            setOrderButtonActive();
          });
        }
      }

      //boxes block
      (() => {
        let boxesIndex = 0;
        const boxesArray = []; //array to set boxes in order
        const barcode = boxesBlock.getAttribute('data-barcode');
        const boxTitle = boxesBlock
          .querySelector('.twpx-ydw-order-form-block-description b')
          .textContent.trim()
          .split(' ')[0];
        const customOption = boxesBlock.querySelector('[data-custom="true"]');
        const customOptionValue =
          customOption &&
          (customOption.getAttribute('value') ||
            customOption.getAttribute('data-value'));

        //create block template for adding
        const blockForAdding = createBlockForAdding();

        //on page load - show/hide custom block
        boxesBlock
          .querySelectorAll('.twpx-ydw-order-form-block-content')
          .forEach((box) => {
            const select =
              box.querySelector('select') ||
              window.twpxSelectManager.selectObject[
                box.querySelector('.twpx-select').getAttribute('data-id')
              ];
            if (storage.boxes.value.checked) {
              select.value = storage.boxes.value.checked;
            }
            if (Object.keys(storage.boxes.value.customSize).length) {
              box
                .querySelectorAll('.twpx-ydw-order-input')
                .forEach((control) => {
                  const value =
                    storage.boxes.value.customSize[
                      control.getAttribute('data-name')
                    ];

                  if (value) {
                    control.value = value;
                    control
                      .closest('.twpx-ydw-order-form-control')
                      .classList.add('twpx-ydw-order-form-control--active');
                  }
                });
            }
            const selectValue = select.value;
            const customBlock = box.querySelector(
              '.twpx-ydw-order-form-control-custom'
            );
            if (selectValue === customOptionValue) {
              customBlock.style.display = 'block';
            } else {
              customBlock.style.display = 'none';
            }
          });

        //box counter
        boxesBlock
          .querySelectorAll('.twpx-ydw-order-form-block-content')
          .forEach((box) => {
            boxesCounter(box);
          });

        //products box select
        createProductsSelect();

        //select events
        selectEvents(boxesBlock);

        //add button
        boxesBlock
          .querySelectorAll('.twpx-ydw-order-add-button')
          .forEach((addButton) => {
            addButton.addEventListener('click', (e) => {
              e.preventDefault();

              const newBlock = blockForAdding.cloneNode(true);

              //twpx select
              newBlock.querySelectorAll('.twpx-select').forEach((select) => {
                new twpxSelect({
                  select,
                  checked: storage.boxes.value.checked,
                });
                showCustomControls(select, storage.boxes.value.checked);
              });
              //select
              newBlock.querySelectorAll('select').forEach((select) => {
                select.value = storage.boxes.value.checked;
                showCustomControls(select, storage.boxes.value.checked);
              });

              addButton.before(newBlock);
              boxesCounter(newBlock);
              createProductsSelect(null, null);
              showDeleteButtons(boxesBlock);

              newBlock
                .querySelectorAll('.twpx-ydw-order-input')
                .forEach((control) => {
                  if (control.getAttribute('data-name')) {
                    const value =
                      storage.boxes.value.customSize[
                        control.getAttribute('data-name')
                      ];

                    if (value) {
                      control.value = value;
                    }
                  }

                  inputEvents(
                    control,
                    control.closest('.twpx-ydw-order-form-control')
                  );
                });

              selectEvents(newBlock);
              fitWindow();
            });
          });

        //delete button
        boxesBlock.addEventListener('click', (e) => {
          if (e.target.classList.contains('twpx-ydw-order-btn-remove')) {
            const content = e.target.closest(
              '.twpx-ydw-order-form-block-content'
            );
            const indexToRemove = content.getAttribute('data-index');
            const currentIndex = boxesArray.findIndex(
              (el) => String(el) === String(indexToRemove)
            );

            content.remove();

            boxesArray.splice(currentIndex, 1);

            createProductsSelect(indexToRemove, currentIndex);
            showDeleteButtons(boxesBlock);

            validateForm();
            disabledPeriodSelects();
            setOrderButtonActive();
          }
        });

        function selectEvents(block) {
          if (block.querySelector('.twpx-select')) {
            block.querySelectorAll('.twpx-select').forEach((boxesSelect) => {
              const boxesTwpxSelect =
                window.twpxSelectManager.selectObject[
                  boxesSelect.getAttribute('data-id')
                ];
              boxesTwpxSelect.onChange = () => {
                showCustomControls(boxesSelect, boxesTwpxSelect.value);
                //storage
                storage.boxes.value.checked = boxesTwpxSelect.value;
                setBX24Storage(
                  storage.boxes.id,
                  JSON.stringify(storage.boxes.value)
                );
                fitWindow();
              };
            });
          } else {
            block.addEventListener('change', (e) => {
              if (e.target.tagName.toLowerCase() === 'select') {
                showCustomControls(e.target, e.target.value);
                //storage
                storage.boxes.value.checked = e.target.value;
                setBX24Storage(
                  storage.boxes.id,
                  JSON.stringify(storage.boxes.value)
                );
              }
            });
          }
        }

        function showCustomControls(select, value) {
          const customBlock = select
            .closest('.twpx-ydw-order-form-wrapper')
            .querySelector('.twpx-ydw-order-form-control-custom');

          if (value === customOptionValue) {
            customBlock.style.display = 'block';
          } else {
            customBlock.style.display = 'none';
          }
        }

        function showDeleteButtons(block) {
          if (
            block.querySelectorAll('.twpx-ydw-order-form-block-content')
              .length > 1
          ) {
            block.classList.add('twpx-ydw-order-form-block--multiple');
          } else {
            block.classList.remove('twpx-ydw-order-form-block--multiple');
          }
        }

        function createBlockForAdding() {
          const blockForAdding = boxesBlock
            .querySelector('.twpx-ydw-order-form-block-content')
            .cloneNode(true);
          const customBlock = blockForAdding.querySelector(
            '.twpx-ydw-order-form-control-custom'
          );

          blockForAdding
            .querySelectorAll('.twpx-ydw-order-form-control')
            .forEach((formControl) => {
              formControl.classList.remove(
                'twpx-ydw-order-form-control--invalid'
              );
              const input = formControl.querySelector('.twpx-ydw-order-input ');
              const select = formControl.querySelector(
                '.twpx-ydw-order-select '
              );
              const twpxSelectElement =
                formControl.querySelector('.twpx-select');

              if (input) {
                input.value = '';
                input.removeAttribute('data-barcode');
                inputEvents(input, formControl);
                formControl.classList.remove(
                  'twpx-ydw-order-form-control--active'
                );
              } else if (select) {
                if (select.value === customOptionValue) {
                  customBlock.style.display = 'block';
                } else {
                  customBlock.style.display = 'none';
                }
              } else if (twpxSelectElement) {
                if (
                  twpxSelectElement.querySelector('[type="hidden"]').value ===
                  customOptionValue
                ) {
                  customBlock.style.display = 'block';
                } else {
                  customBlock.style.display = 'none';
                }
              }
            });
          return blockForAdding;
        }

        function boxesCounter(boxContainer) {
          //boxesArray
          boxesArray.push(boxesIndex);
          //index
          boxContainer.setAttribute('data-index', boxesIndex);
          boxesIndex++;
          //title
          boxContainer.querySelector(
            '.twpx-ydw-order-form-block-description b'
          ).textContent = `${boxTitle} ${boxesIndex}`;
          //barcode
          const input = boxContainer.querySelector(
            '.twpx-ydw-order-form-control--barcode .twpx-ydw-order-input'
          );
          setInputValue(input, `${barcode}_${boxesIndex}`);
          //name attribute
          boxContainer.querySelectorAll('[name]').forEach((control) => {
            let name = control.getAttribute('name');
            control.setAttribute('name', name.replace(/\d/g, boxesIndex));
          });
        }

        function createProductsSelect(indexToRemove, currentIndex) {
          //productSelect
          //select
          productsBlock
            .querySelectorAll(
              '.twpx-ydw-order-form-control--product-box select'
            )
            .forEach((select) => {
              let value = select.value;
              let options = ``;

              if (currentIndex === 0) {
                value = 1 * boxesArray[0] + 1;
              } else if (
                indexToRemove &&
                String(value) === String(1 * indexToRemove + 1)
              ) {
                value = 1 * boxesArray[currentIndex - 1] + 1;
              }

              boxesArray.forEach((boxIndex) => {
                let selected = ``;
                if (String(1 * boxIndex + 1) === String(value)) {
                  selected = ` selected`;
                }
                options += `<option value="${1 * boxIndex + 1}"${selected}>${
                  1 * boxIndex + 1
                }</option>`;
              });
              select.innerHTML = options;
            });

          //twpxSelect
          productsBlock
            .querySelectorAll(
              '.twpx-ydw-order-form-control--product-box .twpx-select'
            )
            .forEach((select) => {
              const productsTwpxSelect =
                window.twpxSelectManager.selectObject[
                  select.getAttribute('data-id')
                ];
              let value = productsTwpxSelect.value;

              if (currentIndex === 0 || currentIndex === undefined) {
                value = String(1 * boxesArray[0] + 1);
              } else if (
                indexToRemove &&
                String(value) === String(1 * indexToRemove + 1)
              ) {
                value = String(1 * boxesArray[currentIndex - 1] + 1);
              }

              let arr = [];
              boxesArray.forEach((boxIndex) => {
                arr.push({
                  code: String(1 * boxIndex + 1),
                  name: String(1 * boxIndex + 1),
                });
              });

              productsTwpxSelect.recreate({ options: arr, val: value });
            });
        }
      })();

      //period block
      (() => {
        const dateSelect = periodBlock.querySelector(
          '#twinpxYadeliveryDateSelect'
        );
        const timeSelect = periodBlock.querySelector(
          '#twinpxYadeliveryTimeSelect'
        );
        const warningNote = periodBlock.querySelector(
          '.twpx-ydw-order-form-control-note'
        );
        let offersArray, dateTwpxSelect, timeTwpxSelect;

        //click button
        dateTwpxSelect =
          window.twpxSelectManager.selectObject[
            dateSelect.getAttribute('data-id')
          ];

        dateTwpxSelect.prepend(periodButton);

        periodButton.addEventListener('click', async (e) => {
          e.preventDefault();

          let formData = new FormData(orderForm),
            controller = new AbortController(),
            response,
            result;

          setTimeout(() => {
            if (!response) {
              controller.abort();
              showError('Connection aborted.', periodBlock);
            }
          }, 20000);

          try {
            //set load
            dateSelect
              .closest('.twpx-ydw-order-form-control')
              .classList.add('twpx-ydw-order-form-control--load');

            response = await fetch(periodButton.getAttribute('data-url'), {
              method: 'POST',
              body: formData,
              signal: controller.signal,
            });

            result = await response.json();

            if (result && typeof result === 'object') {
              if (result.status === 'success') {
                offersArray = result.data;
                //fill the date select
                fillDateSelect();

                //remove load
                dateSelect
                  .closest('.twpx-ydw-order-form-control')
                  .classList.remove('twpx-ydw-order-form-control--load');

                //fill the time select
                fillTimeSelect();

                //remove load
                dateSelect
                  .closest('.twpx-ydw-order-form-control')
                  .classList.remove('twpx-ydw-order-form-control--load');
              } else if (result.errors) {
                //remove load
                dateSelect
                  .closest('.twpx-ydw-order-form-control')
                  .classList.remove('twpx-ydw-order-form-control--load');

                showError(result.errors[0].message, periodBlock);
              }
            }
          } catch (err) {
            //remove load
            dateSelect
              .closest('.twpx-ydw-order-form-control')
              .classList.remove('twpx-ydw-order-form-control--load');

            showError(err, periodBlock);
          }
        });

        //select date
        if (dateSelect.getAttribute('data-id')) {
          window.twpxSelectManager.selectObject[
            dateSelect.getAttribute('data-id')
          ].onChange = fillTimeSelect;
        } else {
          dateSelect.addEventListener('change', fillTimeSelect);
        }

        //select time (if it's not the only one)
        if (timeSelect.getAttribute('data-id')) {
          timeTwpxSelect =
            window.twpxSelectManager.selectObject[
              timeSelect.getAttribute('data-id')
            ];
          timeTwpxSelect.onChange = () => {
            let offer = offersArray.find(
              (offer) => offer.id === timeTwpxSelect.value
            );
            setOrderButtonActive(offer);
          };
        } else {
          timeSelect.addEventListener('change', () => {
            let offer = offersArray.find(
              (offer) => offer.id === timeSelect.value
            );
            setOrderButtonActive(offer);
          });
        }

        //warning note
        warningNote.addEventListener('click', (e) => {
          e.preventDefault();
          validateForm(true, true);
        });

        //form control
        dateSelect
          .closest('.twpx-ydw-order-form-control')
          .addEventListener('click', (e) => {
            if (periodBlock.classList.contains('twpx-period-disabled')) {
              e.preventDefault();
              validateForm(true, true);
            }
          });
        timeSelect
          .closest('.twpx-ydw-order-form-control')
          .addEventListener('click', (e) => {
            if (periodBlock.classList.contains('twpx-period-disabled')) {
              e.preventDefault();
              validateForm(true, true);
            }
          });

        function fillDateSelect() {
          let dateOptions = '';
          let dates = new Set();
          offersArray.forEach((offer) => {
            dates.add(offer.date);
          });
          dates = Array.from(dates);

          //select
          if (dateSelect.tagName.toLowerCase() === 'select') {
            dates.forEach((date) => {
              if (date) {
                dateOptions += `<option value="${date}">${date}</option>`;
              }
            });
            if (dateOptions) {
              dateSelect.innerHTML = dateOptions;
              //set active
              dateSelect
                .closest('.twpx-ydw-order-form-control')
                .classList.add('twpx-ydw-order-form-control--active');
              //remove disabled
              dateSelect.removeAttribute('disabled');
            } else {
              dateSelect.innerHTML = '';
              //remove active
              dateSelect
                .closest('.twpx-ydw-order-form-control')
                .classList.remove('twpx-ydw-order-form-control--active');
              //remove disabled
              dateSelect.setAttribute('disabled', 'disabled');
            }
          } else if (dateSelect.tagName.toLowerCase() === 'div') {
            dateTwpxSelect =
              window.twpxSelectManager.selectObject[
                dateSelect.getAttribute('data-id')
              ];

            dateOptions = [];

            dates.forEach((date) => {
              if (date) {
                dateOptions.push({
                  code: date,
                  name: date,
                });
              }
            });

            dateTwpxSelect.recreate({
              options: dateOptions,
              val: dateOptions[0].code,
              hidePrepend: true,
            });
            dateTwpxSelect.disabled = false;
          }
        }

        function fillTimeSelect() {
          let timeArray;
          if (timeSelect.tagName.toLowerCase === 'select') {
            let timeOptions = '';
            timeArray = offersArray.filter(
              (offer) => offer.date === dateSelect.value
            );
            timeArray.forEach((offer) => {
              if (offer.time) {
                timeOptions += `<option value="${offer.id}">${offer.time}</option>`;
              }
            });
            if (timeOptions) {
              timeSelect.innerHTML = timeOptions;
              //set active
              timeSelect
                .closest('.twpx-ydw-order-form-control')
                .classList.add('twpx-ydw-order-form-control--active');
              //remove disabled
              timeSelect.removeAttribute('disabled');
            } else {
              timeSelect.innerHTML = '';
              //remove active
              timeSelect
                .closest('.twpx-ydw-order-form-control')
                .classList.remove('twpx-ydw-order-form-control--active');
              //remove disabled
              timeSelect.setAttribute('disabled', 'disabled');
            }
          } else if (timeSelect.tagName.toLowerCase() === 'div') {
            timeTwpxSelect =
              window.twpxSelectManager.selectObject[
                timeSelect.getAttribute('data-id')
              ];
            let timeOptions = [];
            timeArray = offersArray.filter(
              (offer) => offer.date === dateTwpxSelect.value
            );
            timeArray.forEach((offer) => {
              if (offer.time) {
                timeOptions.push({
                  code: offer.id,
                  name: offer.time,
                });
              }
            });

            if (timeOptions.length > 0) {
              timeTwpxSelect.recreate({
                options: timeOptions,
                val: timeOptions[0].code,
                hidePrepend: true,
              });
              timeTwpxSelect.disabled = false;
            } else {
              timeTwpxSelect.recreate({
                options: timeOptions,
                hidePrepend: true,
              });
              timeTwpxSelect.disabled = true;
            }
          }

          //set the order button active
          setOrderButtonActive(timeArray[0]);
        }
      })();

      function setOrderButtonActive(offer) {
        if (offer && offer.time && offer.price) {
          orderButton.setAttribute('data-id', offer.id);
          orderButton.removeAttribute('disabled');
          orderButton.textContent = `Заказать — ${offer.price} (с НДС)`;
        } else {
          orderButton.removeAttribute('data-id');
          orderButton.setAttribute('disabled', 'disabled');
          orderButton.textContent = `Сделать заказ`;
        }
      }

      //order button
      (() => {
        orderButtonBlock.addEventListener('click', (e) => {
          if (orderButtonBlock.classList.contains('twpx-button-disabled')) {
            e.preventDefault();
            validateForm(true, true);
          }
        });

        orderButton.addEventListener('click', async (e) => {
          e.preventDefault();

          let formData = new FormData(orderForm),
            controller = new AbortController(),
            response,
            result;

          formData.set('offerId', orderButton.getAttribute('data-id'));

          setTimeout(() => {
            if (!response) {
              controller.abort();
              showError('Connection aborted.', orderButtonBlock);
              validateForm();
              disabledPeriodSelects();
              setOrderButtonActive();
            }
          }, 20000);

          try {
            //set load
            orderButton.classList.add('twpx-ydw-order-btn--loading');

            response = await fetch(orderButton.getAttribute('data-url'), {
              method: 'POST',
              body: formData,
              signal: controller.signal,
            });

            result = await response.json();

            if (result && typeof result === 'object') {
              //remove load
              orderButton.classList.remove('twpx-ydw-order-btn--loading');

              if (result.status === 'success') {
                orderBlock.classList.add('twpx-ydw-order--success');
                if (window.BX24) {
                  BX24.resizeWindow(
                    window.twinpxIframeInitialSize.width,
                    window.twinpxIframeInitialSize.height
                  );
                }
                document.querySelector('#twinpxOrderNumber').innerText =
                  result.data;
              } else if (result.errors) {
                showError(result.errors[0].message, orderButtonBlock);
                validateForm();
                disabledPeriodSelects();
                setOrderButtonActive();
              }
            }
          } catch (err) {
            //remove load
            orderButton.classList.remove('twpx-ydw-order-btn--loading');

            showError(err, orderButtonBlock);
            validateForm();
            disabledPeriodSelects();
            setOrderButtonActive();
          }
        });
      })();

      (() => {
        const moreButton = orderBlock.querySelector(
          '#twinpxYadeliveryMoreButton'
        );
        if (moreButton) {
          orderBlock
            .querySelector('#twinpxYadeliveryMoreButton')
            .addEventListener('click', (e) => {
              e.preventDefault();
              // orderBlock.classList.remove('twpx-ydw-order--success');
              // resetOrderForm();
              if (window.BX24) {
                BX24.closeApplication();
              }
            });
        }
      })();

      //init location
      document.addEventListener('twpxYdwInitLocation', () => {
        // if (window.BX24) {
        //   BX24.resizeWindow(
        //     window.twinpxIframeInitialSize.width,
        //     window.twinpxIframeInitialSize.height
        //   );
        // }

        document
          .querySelector('body')
          .classList.add('twpx-ydw-order--no-scroll');

        //loader
        document
          .querySelector('#location-widget')
          .classList.add('location-widget--loader');

        //show location
        orderBlock.classList.add('twpx-ydw-order--location');

        let error = '';

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
                const widgetElem = document.querySelector('#location-widget');
                const locationElem =
                  widgetElem.querySelector('.twpx-ydw-location');

                widgetElem.classList.remove('location-widget--loader');

                //position
                locationElem.style = `top:${
                  listButtonYCoords - locationElem.clientHeight / 2
                }px; left:calc(50% - ${locationElem.clientWidth / 2}px)`;
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
        // if (window.BX24) {
        //   BX24.resizeWindow(
        //     window.twinpxIframeContentSize.scrollWidth,
        //     window.twinpxIframeContentSize.scrollHeight
        //   );
        // }

        orderBlock.classList.remove('twpx-ydw-order--location');

        document
          .querySelector('body')
          .classList.remove('twpx-ydw-order--no-scroll');
      });

      //init map
      document.addEventListener('twpxYdwInitMap', ({ detail }) => {
        // if (window.BX24) {
        //   BX24.resizeWindow(
        //     window.twinpxIframeInitialSize.width,
        //     window.twinpxIframeInitialSize.height
        //   );
        // }

        document
          .querySelector('body')
          .classList.add('twpx-ydw-order--no-scroll');

        //loader
        document
          .querySelector('#yadelivery-widget')
          .classList.add('yadelivery-widget--loader');

        //show map
        orderBlock.classList.add('twpx-ydw-order--map');

        let error,
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

                const widgetElem = document.querySelector('#ydPopup');

                const height = window.screen.height - 100;

                //position
                widgetElem.style = `top:${
                  listButtonYCoords - height / 2
                }px; height: ${height}px`;

                widgetElem
                  .querySelectorAll(
                    `
                  #ydPopupMap,
                  #ydPopup .yd-popup-error-message,
                  .yd-popup-container.yd-popup--error .yd-popup-map,
                  .yd-popup-list
                `
                  )
                  .forEach((elem) => {
                    elem.style = `height: ${height}px`;
                  });

                widgetElem.querySelector(
                  `.yd-popup-list-detail-wrapper`
                ).style = `height: calc(${height}px - 40px - 60px)`;
              }
            );
          }
          w.twpxYadeliveryWidget
            ? setTimeout(startWidget, 500)
            : document.addEventListener(
                'twpxYadeliveryWidgetLoad',
                startWidget
              );
        })(window);
      });

      //choose terminal
      document.addEventListener('twpxYdwTerminalChosen', (e) => {
        //value
        const activeInput = document.querySelector(
          '.twpx-ydw-order-input[data-active="true"]'
        );
        const activeHiddenInput = activeInput.parentNode.querySelector(
          'input[type="hidden"]'
        );
        const value = `${e.detail.title} (${e.detail.address})`;
        setInputValue(activeInput, value);
        activeHiddenInput.value = JSON.stringify(e.detail);
        activeInput.removeAttribute('data-active');

        //text
        const textDiv = activeInput.parentNode.querySelector(
          '.twpx-ydw-order-form-control-text'
        );
        if (textDiv) {
          textDiv.style.display = 'block';
          textDiv.textContent = value;
        }

        //full marker
        activeInput.parentNode.classList.add(
          'twpx-ydw-order-form-control--full'
        );

        activeInput
          .closest('.twpx-ydw-order-form-control')
          .classList.remove('twpx-ydw-order-form-control--invalid');

        //close map
        document.dispatchEvent(new CustomEvent('twpxYdwCloseMap'));

        //payment
        twpxYdwTerminalPayment = e.detail.payment_methods;
        createPaymentSelect(twpxYdwTerminalPayment);

        validateForm();
        disabledPeriodSelects();
        setOrderButtonActive();
      });

      //close map
      document.addEventListener('twpxYdwCloseMap', () => {
        // if (window.BX24) {
        //   BX24.resizeWindow(
        //     window.twinpxIframeContentSize.scrollWidth,
        //     window.twinpxIframeContentSize.scrollHeight
        //   );
        // }

        orderBlock.classList.remove('twpx-ydw-order--map');

        document
          .querySelector('body')
          .classList.remove('twpx-ydw-order--no-scroll');
      });

      function setInputValue(input, value) {
        const block = input.closest('.twpx-ydw-order-form-control');
        input.value !== undefined
          ? (input.value = value)
          : (input.textContent = value);

        if (String(value).trim() !== '') {
          block.classList.add('twpx-ydw-order-form-control--active');
        } else {
          block.classList.remove('twpx-ydw-order-form-control--active');
        }
      }

      function tabValidation(tab) {
        let regExp = {
          email: /^([^@\s]+)@((?:[-a-z0-9]+\.)+[a-z]{2,})$/i,
        };

        let focusElement;

        //required
        tab.querySelectorAll('[required]').forEach((reqInput) => {
          if (reqInput.value.trim() === '') {
            if (!focusElement) {
              focusElement = reqInput;
            }
            reqInput
              .closest('.twpx-ydw-order-form-control')
              .classList.add('twpx-ydw-order-form-control--invalid');
          } else {
            reqInput
              .closest('.twpx-ydw-order-form-control')
              .classList.remove('twpx-ydw-order-form-control--invalid');
          }
        });

        //email
        Object.keys(regExp).forEach((key) => {
          tab.querySelectorAll(`[type=${key}]`).forEach((input) => {
            //required
            if (
              input.getAttribute('required') === '' ||
              input.value.trim() !== ''
            ) {
              if (!regExp[key].test(input.value)) {
                if (!focusElement) {
                  focusElement = input;
                }
                input
                  .closest('.twpx-ydw-order-form-control')
                  .classList.add('twpx-ydw-order-form-control--invalid');
              } else {
                input
                  .closest('.twpx-ydw-order-form-control')
                  .classList.remove('twpx-ydw-order-form-control--invalid');
              }
            }
          });
        });

        //tel length < 13
        tab.querySelectorAll('[type=tel]').forEach((telInput) => {
          let digits = telInput.value.match(/\d+(\.\d+)?/g);
          if (
            telInput.getAttribute('required') === '' ||
            telInput.value.trim() !== ''
          ) {
            if (!digits || digits.join('').length >= 13) {
              if (!focusElement) {
                focusElement = telInput;
              }
              telInput
                .closest('.twpx-ydw-order-form-control')
                .classList.add('twpx-ydw-order-form-control--invalid');
            } else {
              telInput
                .closest('.twpx-ydw-order-form-control')
                .classList.remove('twpx-ydw-order-form-control--invalid');
            }
          }
        });

        if (focusElement) {
          focusElement.focus();
        }

        return focusElement;
      }

      // tabValidation(document.getElementById('twinpxYadeliveryWhere'));
      // tabValidation(document.getElementById('twpxYdwPaymentInput'));

      function showError(message, block) {
        errorBlock.querySelector('.twpx-ydw-order-error-content').innerHTML =
          message;
        errorBlock.classList.add('twpx-ydw-order-error--show');
        orderForm.insertBefore(errorBlock, block);
        fitWindow();
      }

      function hideError() {
        errorBlock.classList.remove('twpx-ydw-order-error--show');
      }

      function resetOrderForm() {
        //from
        //where
        //payment
        //boxes
        //products
        //periods
        //button
      }

      function setBX24Storage(id, value) {
        if (window.BX24 && id) {
          BX24.callMethod('entity.item.update', {
            ENTITY: 'twpx_ydw',
            ID: id,
            DETAIL_TEXT: value,
            PROPERTY_VALUES: {},
          });
        }
      }

      document.addEventListener('click', (e) => {
        //hide error
        if (
          !e.target.classList.contains('twpx-ydw-order-error') &&
          !e.target.classList.contains('twpx-ydw-order-error-content')
        ) {
          errorBlock.classList.remove('twpx-ydw-order-error--show');
        }
      });

      validateForm();
      disabledPeriodSelects();
      setOrderButtonActive();
    }
  });
});
