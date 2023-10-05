window.addEventListener('DOMContentLoaded', () => {
  const lang = {
    TWINPX_JS_NO_YMAP_KEY:
      'Администратор не указал ключ Яндекс Карт в Настройках системы. Дальнейшая работа модуля Яндекс Доставка невозможна.',
    TWINPX_JS_FIO: 'ФИО',
    TWINPX_JS_EMAIL: 'E-mail',
    TWINPX_JS_PHONE: 'Телефон',
    TWINPX_JS_ADDRESS: 'Адрес',
    TWINPX_JS_COMMENT: 'Комментарий',
    TWINPX_JS_CITY: 'Город',
    TWINPX_JS_STREET: 'Улица',
    TWINPX_JS_HOME: 'Дом',
    TWINPX_JS_CORP: 'Корпус',
    TWINPX_JS_AP: 'Оф./Кв.',
    TWINPX_JS_CONTINUE: 'Продолжить',
    TWINPX_JS_RESET: 'Отменить',
    TWINPX_JS_TYPE: 'Варианты доставки',
    TWINPX_JS_RETURN_LIST: 'Вернуться к списку',
    TWINPX_JS_CLOSE: 'Закрыть',
    TWINPX_JS_ONLIST: 'В списке',
    TWINPX_JS_SELECT: 'Выбрать',
    TWINPX_JS_ONCART: 'На карте',
    TWINPX_JS_VARIANT: 'Варианты доставки<br>до пункта выдачи заказов',
    TWINPX_JS_EMPTY_LIST:
      'Не удалось загрузить список пунктов выдачи.<br>Пожалуйста, попробуйте позже.',
    TWINPX_JS_EMPTY_OFFER:
      'Не удалось получить варианты доставки для выбранного пункта выдачи.<br>Пожалуйста, попробуйте позже или выберите другой пункт выдачи заказа.',
    TWINPX_JS_NO_RESPONSE: 'Сервер не отвечает.',
    TWINPX_JS_MULTIPLE_POINTS:
      'В данной точке несколько пунктов выдачи. Выберите в списке.',
  };

  let ydPopupContainer,
    ydPopupList,
    ydPopupWrapper,
    ydPopupDetailWrapper,
    ydPopupDetail,
    ydPopupSlide,
    ydPopupSlideDetail,
    errorFormElem,
    map,
    objectManager,
    bounds,
    firstGeoObjectCoords,
    regionName,
    payment,
    pointsArray,
    pointsNodesArray = {},
    newBounds = [],
    fetchTimeout = 20000;
  yadeliveryMode = 'simple';

  let container = `<div class="yd-popup-container yd-popup--map ${
    yadeliveryMode === 'simple' ? 'yd-popup--simple' : ''
  }">
      <div class="yd-popup-error-message">
        <div class="yd-popup-error__message">
          <i style="background-image: url(/bitrix/images/twinpx.yadelivery/danger.svg)"></i>
          ${lang['TWINPX_JS_NO_YMAP_KEY']}
        </div>
      </div>
      <div id="ydPopupMap" class="yd-popup-map load-circle"></div>
      <div class="yd-popup-list">
        <div class="yd-popup-list-wrapper load-circle"></div>
        <div class="yd-popup-list-detail-wrapper">
          <div class="yd-popup-list-detail"></div>
        </div>
      </div>
    </div>`;

  document.getElementById('ydPopup').innerHTML = container;

  pvzPopupShow();

  async function pvzPopupShow() {
    //show error if there is no api ymaps key
    if (!window.twinpxYadeliveryYmapsAPI) {
      document
        .querySelector('#ydPopup')
        .classList.add('yd-popup--error-message');
    }

    onPopupShow();
  }

  function elemLoader(elem, flag) {
    flag
      ? elem.classList.add('load-circle')
      : elem.classList.remove('load-circle');
  }

  function pointsError(message) {
    ydPopupWrapper.innerHTML = `<div class="yd-popup-error__message"><i style="background-image: url(/bitrix/images/twinpx.yadelivery/danger.svg)"></i>${
      message || lang['TWINPX_JS_EMPTY_LIST']
    }</div>`;
  }

  function offersError(error) {
    ydPopupSlideDetail.innerHTML = `<div class="yd-popup-error__message"><i style="background-image: url(/bitrix/images/twinpx.yadelivery/danger.svg)"></i>${error}</div>`;
    ydPopupDetail.innerHTML = `<div class="yd-popup-error__message"><i style="background-image: url(/bitrix/images/twinpx.yadelivery/danger.svg)"></i>${error}</div>`;
    elemLoader(ydPopupSlideDetail, false);
    elemLoader(ydPopupDetailWrapper, false);
  }

  function onObjectEvent(e) {
    let id = e.get('objectId');

    let pointObject = pointsArray.find((p) => {
      return p.id === id;
    });

    clickPlacemark(pointObject, map, pointObject.coords);
  }

  function onClusterEvent(e) {
    //show points on the slide
    ydPopupSlideDetail.innerHTML = '';

    for (let key in pointsNodesArray) {
      if (pointsNodesArray[key]['sorted'] === true) {
        let pointNode = pointsNodesArray[key]['node'].cloneNode(true);
        ydPopupSlideDetail.appendChild(pointNode);
      }
    }
  }

  function setPopupMode(mode) {
    ydPopupContainer.classList.remove(
      'yd-popup--map',
      'yd-popup--detail',
      'yd-popup--list',
      'yd-popup--slide'
    );
    ydPopupContainer.classList.add(`yd-popup--${mode}`);
  }

  function createPointsItem({
    id,
    title,
    type,
    schedule,
    address,
    coords,
    json,
  }) {
    let item = document.createElement('div');
    item.className = 'yd-popup-list__item';
    item.setAttribute('data-id', id);
    item.setAttribute('data-address', address);
    item.setAttribute('data-coords', coords);
    item.setAttribute('data-json', json);

    item.innerHTML = `
        <div class="yd-popup-list__title">${title}</div>
        <div class="yd-popup-list__text">
        <span>${type}</span> ${schedule}<br>
        ${address}
        </div>
        <div class="yd-popup-btn yd-popup-btn--red">${lang['TWINPX_JS_SELECT']}</div>
      `;

    return item;
  }

  function createItem(id) {
    //item content
    let item = ydPopupList.querySelector(`[data-id="${id}"]`).cloneNode(true);
    let slideItem = ydPopupList
      .querySelector(`[data-id="${id}"]`)
      .cloneNode(true);

    item.querySelector('.yd-popup-btn').style.display = 'none';
    slideItem.querySelector('.yd-popup-btn').style.display = 'none';

    return [item, slideItem];
  }

  function clickPlacemark(jsonObject, map, coords) {
    let itemsArray = createItem(jsonObject.id);

    setPopupMode('slide');

    elemLoader(ydPopupSlideDetail, true);
    elemLoader(ydPopupDetailWrapper, true);

    ydPopupSlideDetail.innerHTML = '';
    ydPopupDetail.innerHTML = '';

    showOffers({ jsonObject, map, coords, itemsArray });
  }

  async function showOffers({ jsonObject, map, coords, itemsArray, props }) {
    let c = coords;
    //pan map on desktop
    if (typeof coords === 'string') {
      c = coords.split(',');
      c[0] = c[0] * 1;
      c[1] = c[1] * 1;
    }
    map.panTo(c).then(() => {
      map.setZoom(16);
    });

    if (!itemsArray) {
      itemsArray = createItem(jsonObject.id);
    }

    let item = itemsArray[0];
    let slideItem = itemsArray[1];

    //get offers
    let formData = new FormData();
    formData.set('action', 'pvzOffer');

    if (props) {
      formData.set('props', props);
    }

    let controller = new AbortController();
    let response;

    setTimeout(() => {
      if (!response) {
        controller.abort();
      }
    }, fetchTimeout);

    try {
      response = await fetch(
        window.twinpxYadeliveryFetchURL /*, {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      }*/
      );

      let result = await response.json();

      let html = '';

      if (result && typeof result === 'object') {
        if (result.STATUS === 'Y') {
          //set address value
          errorFormElem.querySelector('[data-code="PropAddress"]').value = `${
            item.querySelector('.yd-popup-list__title').textContent
          }, ${item.getAttribute('data-address')}.`;

          if (result.ERRORS) {
            offersError(result.ERRORS);

            if (result.FIELDS) {
              ydPopupList.classList.add('yd-popup-list--form');
              ydPopupSlide.classList.add('yd-popup-slide--form');

              //get input values
              Object.keys(result.FIELDS).forEach((key) => {
                let formControls = document.querySelectorAll(
                  `[name="${result.FIELDS[key]}"]`
                );
                let errorFormControl = errorFormElem.querySelector(
                  `[data-code="${key}"]`
                );
                let slideErrorFormControl = ydPopupSlideErrorForm.querySelector(
                  `[data-code="${key}"]`
                );

                if (
                  !formControls ||
                  !errorFormControl ||
                  !slideErrorFormControl
                )
                  return;

                let value = '';
                formControls.forEach((formControl) => {
                  if (!value && formControl.value) {
                    value = formControl.value;
                  }
                });

                //set values for all the controls except address hidden input
                if (
                  !errorFormControl.getAttribute('type') ||
                  errorFormControl.getAttribute('type') !== 'hidden'
                ) {
                  errorFormControl.value = value;
                }
                if (
                  !slideErrorFormControl.getAttribute('type') ||
                  slideErrorFormControl.getAttribute('type') !== 'hidden'
                ) {
                  slideErrorFormControl.value = value;
                }

                //set name attribute
                errorFormControl.setAttribute('name', result.FIELDS[key]);
                slideErrorFormControl.setAttribute('name', result.FIELDS[key]);

                //active label
                if (
                  errorFormControl.value.trim() !== '' &&
                  errorFormControl.closest('.b-float-label')
                ) {
                  errorFormControl
                    .closest('.b-float-label')
                    .querySelector('label')
                    .classList.add('active');
                }
                if (
                  slideErrorFormControl.value.trim() !== '' &&
                  slideErrorFormControl.closest('.b-float-label')
                ) {
                  slideErrorFormControl
                    .closest('.b-float-label')
                    .querySelector('label')
                    .classList.add('active');
                }
              });

              //validate inputs
              errorFormValidation(errorFormElem.querySelector('form'));
              errorFormValidation(ydPopupSlideErrorForm.querySelector('form'));
            }
          } else if (result.OFFERS) {
            html = `<div class="yd-h3">${lang['TWINPX_JS_VARIANT']}</div>`;

            result.OFFERS.forEach(({ json, date, time, price }) => {
              html += `
                <div class="yd-popup-offer" data-json='${json}'>
                  <div class="yd-popup-offer__info">
                  <div class="yd-popup-offer__date">${date}</div>
                  <div class="yd-popup-offer__time">${time}</div>
                  </div>
                  <div class="yd-popup-offer__price">${price}</div>
                  <div class="yd-popup-btn yd-popup-btn--red">${lang['TWINPX_JS_SELECT']}</div>
                </div>
                `;
            });

            //remove preloader
            elemLoader(ydPopupDetailWrapper, false);
            elemLoader(ydPopupSlideDetail, false);

            ydPopupDetail.innerHTML = html;
            ydPopupSlideDetail.innerHTML = html;
          } else {
            offersError(lang['TWINPX_JS_EMPTY_OFFER']);
          }
        } else {
          offersError(lang['TWINPX_JS_NO_RESPONSE']);
        }
      }
    } catch (err) {
      offersError(lang['TWINPX_JS_NO_RESPONSE']);
    }

    //item content
    ydPopupDetail.prepend(item);
    ydPopupSlideDetail.prepend(slideItem);

    ydPopupDetailWrapper.scrollTo({
      top: 0,
    });

    ydPopupSlideWrapper.scrollTo({
      top: 0,
    });
  }

  function onPopupShow(errorMessage) {
    ydPopupContainer = document.querySelector('#ydPopup .yd-popup-container');
    ydPopupList = ydPopupContainer.querySelector('.yd-popup-list');
    ydPopupWrapper = ydPopupList.querySelector('.yd-popup-list-wrapper');
    ydPopupDetailWrapper = ydPopupList.querySelector(
      '.yd-popup-list-detail-wrapper'
    );
    ydPopupDetail = ydPopupList.querySelector('.yd-popup-list-detail');
    ydPopupSlide = ydPopupContainer.querySelector('.yd-popup-slide');
    ydPopupSlideWrapper = ydPopupContainer.querySelector(
      '.yd-popup-slide-wrapper'
    );
    ydPopupSlideDetail = ydPopupContainer.querySelector(
      '.yd-popup-slide-detail'
    );
    ydPopupSlideErrorForm = ydPopupContainer.querySelector(
      '.yd-popup-slide-error-form'
    );
    errorFormElem = ydPopupList.querySelector('.yd-popup-error-form');

    pointsArray = [];

    //choose point event
    ydPopupWrapper.addEventListener('click', (e) => {
      e.preventDefault();

      let item;

      if (e.target.classList.contains('yd-popup-list__item')) {
        item = e.target;
      } else if (e.target.closest('.yd-popup-list__item')) {
        item = e.target.closest('.yd-popup-list__item');
      }

      if (!item) return;

      function getProp(prop) {
        return item.getAttribute(`data-${prop}`);
      }

      if (e.target.classList.contains('yd-popup-btn')) {
        console.log(getProp('id'), getProp('address'));
      }
    });

    //ymaps
    if (window.ymaps && window.ymaps.ready) {
      ymaps.ready(() => {
        //let regionName = prompt('city'); use it if region change is needed
        //check if region exists
        if (!regionName && errorMessage) {
          elemLoader(document.querySelector('#ydPopupMap'), false);
          elemLoader(ydPopupWrapper, false);

          ydPopupContainer.innerHTML = `<div class="yd-popup-error__message"><i style="background-image: url(/bitrix/images/twinpx.yadelivery/danger.svg)"></i>${errorMessage}</div>`;
          return;
        }

        //geo code
        const myGeocoder = ymaps.geocode(
          regionName.replace(/\u0451/g, '\u0435').replace(/\u0401/g, '\u0415'),
          {
            results: 1,
          }
        );

        myGeocoder.then((res) => {
          // first result, its coords and bounds
          let firstGeoObject = res.geoObjects.get(0);
          firstGeoObjectCoords = firstGeoObject.geometry.getCoordinates();
          bounds = firstGeoObject.properties.get('boundedBy');
          newBounds = bounds;

          map = new ymaps.Map(
            'ydPopupMap',
            {
              center: firstGeoObjectCoords,
              zoom: 9,
              controls: ['searchControl'],
            },
            {
              suppressMapOpenBlock: true,
            }
          );

          let zoomControl = new ymaps.control.ZoomControl();
          map.controls.add(zoomControl);

          let customBalloonContentLayout =
            ymaps.templateLayoutFactory.createClass(
              `<div class="yd-popup-balloon-content">${lang['TWINPX_JS_MULTIPLE_POINTS']}</div>`
            );

          objectManager = new ymaps.ObjectManager({
            clusterize: true,
            clusterBalloonContentLayout: customBalloonContentLayout,
          });

          objectManager.objects.options.set('iconLayout', 'default#image');
          objectManager.objects.options.set('iconImageHref', 'yandexPoint.svg');
          objectManager.objects.options.set('iconImageSize', [32, 42]);
          objectManager.objects.options.set('iconImageOffset', [-16, -42]);
          objectManager.clusters.options.set(
            'preset',
            'islands#blackClusterIcons'
          );
          objectManager.objects.events.add(['click'], onObjectEvent);
          objectManager.clusters.events.add(['balloonopen'], onClusterEvent);

          let firstBound = true;

          if (map) {
            //add object manager
            map.geoObjects.add(objectManager);
            //remove preloader
            elemLoader(document.querySelector('#ydPopupMap'), false);
            //map bounds
            map.setBounds(bounds, {
              checkZoomRange: true,
            });
            //events
            map.events.add('boundschange', onBoundsChange);
            map.events.add('click', () => {
              setPopupMode('map');
            });
          }

          function onBoundsChange(e) {
            newBounds = e ? e.get('newBounds') : newBounds;

            if (firstBound) {
              firstBound = false;
              return;
            }

            //wrapper sorted mode
            ydPopupWrapper.classList.add('yd-popup-list-wrapper--sorted');

            //clear sorted pvz
            for (let key in pointsNodesArray) {
              if (pointsNodesArray[key]['sorted'] === true) {
                pointsNodesArray[key]['sorted'] = false;
                pointsNodesArray[key]['node'].classList.remove(
                  'yd-popup-list__item--sorted'
                );
              }
            }

            //items array
            let arr = pointsArray.filter((point) => {
              return (
                point.coords[0] > newBounds[0][0] &&
                point.coords[0] < newBounds[1][0] &&
                point.coords[1] > newBounds[0][1] &&
                point.coords[1] < newBounds[1][1]
              );
            });

            //set items sorted
            arr.forEach((point) => {
              let sortedItem = pointsNodesArray[point.id]['node'];
              pointsNodesArray[point.id]['sorted'] = true;
              if (sortedItem) {
                sortedItem.classList.add('yd-popup-list__item--sorted');
              }
            });
          }

          //send to the server
          (async () => {
            //get offices
            let formData = new FormData();
            formData.set(
              'fields',
              `lat-from=${bounds[0][0]}&lat-to=${bounds[1][0]}&lon-from=${bounds[0][1]}&lon-to=${bounds[1][1]}`
            );

            let controller = new AbortController();
            let response;

            setTimeout(() => {
              if (!response) {
                controller.abort();
              }
            }, fetchTimeout);

            try {
              response = await fetch(
                window.twinpxYadeliveryFetchPointsURL /*, {
                method: 'POST',
                body: formData,
                signal: controller.signal,
              }*/
              );
              let result = await response.json();

              //remove preloader
              elemLoader(ydPopupWrapper, false);

              if (result && typeof result === 'object') {
                if (result.STATUS === 'Y') {
                  if (result.ERRORS) {
                    pointsError(result.ERRORS);
                  } else {
                    if (result.POINTS) {
                      //fill pointsArray
                      pointsArray = result.POINTS;

                      //list
                      let pointsFlag,
                        objectsArray = [];

                      result.POINTS.forEach((point) => {
                        if (!point.id) return;

                        pointsFlag = true;

                        //placemark
                        objectsArray.push({
                          type: 'Feature',
                          id: point.id,
                          geometry: {
                            type: 'Point',
                            coordinates: point.coords,
                          },
                        });

                        //list
                        let item = createPointsItem(point);
                        ydPopupWrapper.appendChild(item);

                        //push to nodes array
                        pointsNodesArray[point.id] = {
                          node: item,
                          sorted: false,
                        };
                      });

                      objectManager.add(objectsArray);

                      if (!pointsFlag) {
                        pointsError();
                      }

                      //map bounds
                      if (map) {
                        centerCoords = map.getCenter();
                      }

                      //if the map was moved while offices were loading
                      if (
                        ydPopupWrapper.classList.contains(
                          'yd-popup-list-wrapper--sorted'
                        )
                      ) {
                        onBoundsChange();
                      }
                    } else {
                      pointsError(lang['TWINPX_JS_EMPTY_OFFER']);
                    }
                  }
                } else {
                  pointsError(lang['TWINPX_JS_NO_RESPONSE']);
                }
              }
            } catch (err) {
              pointsError();
            }
          })();
        });
      });
    }
  }
});
