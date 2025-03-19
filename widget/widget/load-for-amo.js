window.twpxYadeliveryWidget.JS = (options) => {
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
    TWINPX_JS_CHOOSE: 'Выбрать',
    TWINPX_JS_RESET: 'Отменить',
    TWINPX_JS_TYPE: 'Варианты доставки',
    TWINPX_JS_RETURN_LIST: 'Вернуться к списку',
    TWINPX_JS_CLOSE: 'Закрыть',
    TWINPX_JS_ONLIST: 'В списке',
    TWINPX_JS_SELECT: 'Подробнее',
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

  const filterData = [
    {
      code: 'type',
      items: [
        {
          name: 'Постамат',
          code: 'terminal',
        },
        {
          name: 'Пункт выдачи',
          code: 'pickup_point',
        },
      ],
    },
    {
      code: 'payment_methods',
      items: [
        {
          name: 'Оплата не нужна',
          code: 'already_paid',
        },
        {
          name: 'Оплата наличными при получении',
          code: 'cash_on_receipt',
        },
        {
          name: 'Оплата картой при получении',
          code: 'card_on_receipt',
        },
      ],
    },
  ];

  let ydPopupContainer,
    ydPopupError,
    ydPopupMap,
    ydPopupList,
    ydPopupWrapper,
    ydPopupDetailWrapper,
    ydPopupDetail,
    ydPopupFilter,
    ydPopupFilterBtn,
    ydPopupFilterForm,
    ydPopupFilterText,
    map,
    objectManager,
    bounds,
    firstGeoObjectCoords,
    regionName,
    payment,
    pointsArray,
    pointsNodesArray = {},
    newBounds = [],
    fetchTimeout = 20000,
    checkedFilter = [];

  let container = `<div id="ydPopup">
    <div class="yd-popup-container yd-popup--map">
      <div class="yd-popup-error-message">
        <div class="yd-popup-error__message">
          <i><svg id="danger" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
          <path id="Vector" d="M0,0V5" transform="translate(12 9)" fill="none" stroke="#fff" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"/>
          <path id="Vector-2" data-name="Vector" d="M10,18.817H3.939c-3.47,0-4.92-2.48-3.24-5.51l3.12-5.62,2.94-5.28c1.78-3.21,4.7-3.21,6.48,0l2.94,5.29,3.12,5.62c1.68,3.03.22,5.51-3.24,5.51H10Z" transform="translate(2.001 2.592)" fill="none" stroke="#fff" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"/>
          <path id="Vector-3" data-name="Vector" d="M0,0H.009" transform="translate(11.995 17)" fill="none" stroke="#fff" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/>
          <path id="Vector-4" data-name="Vector" d="M0,0H24V24H0Z" fill="none" opacity="0"/>
        </svg></i>
          ${lang['TWINPX_JS_NO_YMAP_KEY']}
        </div>
      </div>
      <div id="ydPopupMap" class="yd-popup-map load-circle"></div>
      <div class="yd-popup-list">
        <div class="yd-popup-list-change-location-button">
          <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="6.446" height="10.891" viewBox="0 0 6.446 10.891">
            <defs><clipPath id="clip-path"><rect width="6.446" height="10.891" transform="translate(0 0)" fill="none" stroke="#0b0b0b" stroke-width="1"/></clipPath></defs>
            <g transform="translate(0 0)"><g clip-path="url(#clip-path)"><path d="M5.446,9.891,1,5.445,5.446,1" fill="none" stroke="#0b0b0b" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/></g></g>
          </svg>
          Изменить местоположение
        </div>
        <div class="yd-popup-list-filter">
          <div class="yd-popup-list-filter-form"></div>
          <div class="yd-popup-list-filter-btn">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
              <g id="filter-square" transform="translate(-622 -510)">
                <path id="Vector" d="M30.32,3.408A6.823,6.823,0,0,0,28.592,1.68,9.828,9.828,0,0,0,22.7,0H9.3a9.093,9.093,0,0,0-.944.048C3.1.384,0,3.792,0,9.3V22.7a9.828,9.828,0,0,0,1.68,5.888A6.823,6.823,0,0,0,3.408,30.32a9.246,9.246,0,0,0,4.944,1.648c.3.016.624.032.944.032H22.7c5.824,0,9.3-3.472,9.3-9.3V9.3A9.828,9.828,0,0,0,30.32,3.408ZM10.336,13.888l-.784-.816a2.771,2.771,0,0,1-.752-1.68V9.472a1.7,1.7,0,0,1,1.68-1.76H13.9a.833.833,0,0,1,.7,1.28l-2.96,4.768A.83.83,0,0,1,10.336,13.888ZM23.2,11.232a3.108,3.108,0,0,1-.832,1.92l-3.6,3.184a2.725,2.725,0,0,0-.832,1.92v3.6a1.891,1.891,0,0,1-.752,1.424L16,24.032a1.7,1.7,0,0,1-2.592-1.424V18.176a3.21,3.21,0,0,0-.672-1.76L12.352,16a.867.867,0,0,1-.112-1.024L16.528,8.1a.855.855,0,0,1,.7-.4H21.52a1.68,1.68,0,0,1,1.68,1.68v1.856Z" transform="translate(622 510)" fill="#fb3f1d"/>
              </g>
            </svg>
            <span class="yd-popup-list-filter-text">Пункты выдачи, Постаматы, Оплата наличными при получении, Оплата картой при получении</span>
          </div>
        </div>
        <div class="yd-popup-list__location">Пункты выдачи в ${options.params.city}</div>
        <div class="yd-popup-list-wrapper load-circle"></div>
        <div class="yd-popup-list-detail-wrapper">
          <div class="yd-popup-list__back">
            <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="6.446" height="10.891" viewBox="0 0 6.446 10.891">
              <defs><clipPath id="clip-path"><rect width="6.446" height="10.891" transform="translate(0 0)" fill="none" stroke="#0b0b0b" stroke-width="1"/></clipPath></defs>
              <g transform="translate(0 0)"><g clip-path="url(#clip-path)"><path d="M5.446,9.891,1,5.445,5.446,1" fill="none" stroke="#0b0b0b" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/></g></g>
            </svg>
            ${lang['TWINPX_JS_RETURN_LIST']}
          </div>
          <div class="yd-popup-list-detail"></div>
        </div>
        <div class="yd-popup-list-close-button">Закрыть</div>
      </div>
    </div>
  </div>`;

  document.getElementById(options.containerId).innerHTML = container;

  pvzPopupShow();

  async function pvzPopupShow() {
    //show error if there is no api ymaps key
    if (!window.twinpxYadeliveryYmapsAPI) {
      document
        .querySelector('#ydPopup')
        .classList.add('yd-popup--error-message');
    }

    regionName = options.params.city;
    payment = options.params.payment_methods;
    onPopupShow();
  }

  function elemLoader(elem, flag) {
    flag
      ? elem.classList.add('load-circle')
      : elem.classList.remove('load-circle');
  }

  function pointsError(message) {
    ydPopupWrapper.innerHTML = `<div class="yd-popup-error__message"><i><svg id="danger" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
    <path id="Vector" d="M0,0V5" transform="translate(12 9)" fill="none" stroke="#fff" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"/>
    <path id="Vector-2" data-name="Vector" d="M10,18.817H3.939c-3.47,0-4.92-2.48-3.24-5.51l3.12-5.62,2.94-5.28c1.78-3.21,4.7-3.21,6.48,0l2.94,5.29,3.12,5.62c1.68,3.03.22,5.51-3.24,5.51H10Z" transform="translate(2.001 2.592)" fill="none" stroke="#fff" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"/>
    <path id="Vector-3" data-name="Vector" d="M0,0H.009" transform="translate(11.995 17)" fill="none" stroke="#fff" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/>
    <path id="Vector-4" data-name="Vector" d="M0,0H24V24H0Z" fill="none" opacity="0"/>
  </svg></i>${message}</div>`;
  }

  function onObjectEvent(e) {
    let id = e.get('objectId');

    let pointObject = pointsArray.find((p) => {
      return p.id === id;
    });

    clickPlacemark(pointObject, map);
  }

  function onClusterEvent(e) {}

  function setPopupMode(mode) {
    ydPopupContainer.classList.remove(
      'yd-popup--map',
      'yd-popup--detail',
      'yd-popup--list',
      'yd-popup--slide'
    );
    ydPopupContainer.classList.add(`yd-popup--${mode}`);
  }

  function createPointsItem(pointObject) {
    let item = document.createElement('div');
    item.className = 'yd-popup-list__item';
    item.setAttribute('data-id', pointObject.id);
    item.setAttribute('data-address', pointObject.address);
    item.setAttribute('data-coords', pointObject.coords);
    item.setAttribute('data-json', JSON.stringify(pointObject));

    item.innerHTML = `
        <div class="yd-popup-list__title">${pointObject.title}</div>
        <div class="yd-popup-list__text">
        <span>${pointObject.type.name}</span>. ${pointObject.schedule}<br>
        ${pointObject.address}
        </div>
        <div class="yd-popup-btn yd-popup-btn--darkgray">${lang['TWINPX_JS_SELECT']}</div>
      `;

    return item;
  }

  function createDetailItem(pointObject) {}

  async function showDetail(pointObject, map) {
    //set detail mode
    setPopupMode('detail');
    ydPopupDetail.innerHTML = '';

    let itemsArray = createDetailItem(pointObject);

    await showOffers({ pointObject, map, itemsArray });
  }

  function clickPlacemark(pointObject, map) {
    let itemsArray = createDetailItem(pointObject);

    setPopupMode('detail');

    ydPopupDetail.innerHTML = '';

    showOffers({
      pointObject,
      map,
      itemsArray,
    });
  }

  async function showOffers({ pointObject, map, itemsArray }) {
    let c = pointObject.coords;
    //pan map on desktop
    if (typeof pointObject.coords === 'string') {
      c = pointObject.coords.split(',');
      c[0] = c[0] * 1;
      c[1] = c[1] * 1;
    }
    map.panTo(c).then(() => {
      map.setZoom(16);
    });

    if (!itemsArray) {
      itemsArray = createDetailItem(pointObject);
    }

    let item = itemsArray[0];

    //item content
    ydPopupDetail.prepend(item);
  }

  function onPopupShow(errorMessage) {
    ydPopupContainer = document.querySelector('#ydPopup .yd-popup-container');
    ydPopupError = ydPopupContainer.querySelector('.yd-popup-error-message');
    ydPopupMap = ydPopupContainer.querySelector('#ydPopupMap');
    ydPopupList = ydPopupContainer.querySelector('.yd-popup-list');
    ydPopupWrapper = ydPopupList.querySelector('.yd-popup-list-wrapper');
    ydPopupDetailWrapper = ydPopupList.querySelector(
      '.yd-popup-list-detail-wrapper'
    );
    ydPopupDetail = ydPopupList.querySelector('.yd-popup-list-detail');
    ydPopupFilter = ydPopupList.querySelector('.yd-popup-list-filter');
    ydPopupFilterBtn = ydPopupList.querySelector('.yd-popup-list-filter-btn');
    ydPopupFilterForm = ydPopupList.querySelector('.yd-popup-list-filter-form');
    ydPopupFilterText = ydPopupList.querySelector('.yd-popup-list-filter-text');

    pointsArray = [];

    //create filter
    ydPopupFilterBtn.addEventListener('click', (e) => {
      e.preventDefault();
      ydPopupFilter.classList.toggle('yd-popup-list-filter--form');
    });

    let filterHTML = '';
    filterData.forEach((data) => {
      data.items.forEach((item) => {
        filterHTML += `<div class="yd-popup-list-filter-item yd-popup-list-filter-item--checked" data-type="${data.code}" data-code="${item.code}">${item.name}</div>`;
      });
    });

    ydPopupFilterForm.innerHTML = filterHTML;

    //choose location button
    ydPopupList
      .querySelector('.yd-popup-list-change-location-button')
      .addEventListener('click', (e) => {
        e.preventDefault();
        document.dispatchEvent(new CustomEvent('twpxYdwCloseMap'));
        document.dispatchEvent(new CustomEvent('twpxYdwInitLocation'));
      });

    //close button
    ydPopupList
      .querySelector('.yd-popup-list-close-button')
      .addEventListener('click', (e) => {
        e.preventDefault();
        document.dispatchEvent(new CustomEvent('twpxYdwCloseMap'));
      });

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
        setPopupMode('detail');
        showDetail(JSON.parse(getProp('json')), map);
      } else {
        //pan map
        let coords = getProp('coords').split(',');
        coords[0] = coords[0] * 1;
        coords[1] = coords[1] * 1;
        map.panTo(coords).then(() => {
          map.setZoom(16);
        });
      }
    });

    function tokenOrApiKeyErrors(message) {
      elemLoader(ydPopupMap, false);
      elemLoader(ydPopupWrapper, false);

      document
        .querySelector('#ydPopup')
        .classList.add('yd-popup--error-message');
      ydPopupError.innerHTML = `<div class="yd-popup-error__message"><i><svg id="danger" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
      <path d="M0,0V5" transform="translate(12 9)" fill="none" stroke="#fff" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"/>
      <path d="M10,18.817H3.939c-3.47,0-4.92-2.48-3.24-5.51l3.12-5.62,2.94-5.28c1.78-3.21,4.7-3.21,6.48,0l2.94,5.29,3.12,5.62c1.68,3.03.22,5.51-3.24,5.51H10Z" transform="translate(2.001 2.592)" fill="none" stroke="#fff" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"/>
      <path d="M0,0H.009" transform="translate(11.995 17)" fill="none" stroke="#fff" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/>
      <path d="M0,0H24V24H0Z" fill="none" opacity="0"/>
    </svg></i>${message}</div>`;
    }

    //errors - token or api key
    if (options.params.error) {
      tokenOrApiKeyErrors(options.params.error);
      return;
    }
    //ymaps
    else if (window.ymaps && window.ymaps.ready) {
      ymaps.ready(() => {
        //let regionName = prompt('city'); use it if region change is needed
        //check if region exists
        if (!regionName && errorMessage) {
          elemLoader(ydPopupMap, false);
          elemLoader(ydPopupWrapper, false);

          ydPopupContainer.innerHTML = `<div class="yd-popup-error__message"><i><svg id="danger" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
          <path id="Vector" d="M0,0V5" transform="translate(12 9)" fill="none" stroke="#fff" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"/>
          <path id="Vector-2" data-name="Vector" d="M10,18.817H3.939c-3.47,0-4.92-2.48-3.24-5.51l3.12-5.62,2.94-5.28c1.78-3.21,4.7-3.21,6.48,0l2.94,5.29,3.12,5.62c1.68,3.03.22,5.51-3.24,5.51H10Z" transform="translate(2.001 2.592)" fill="none" stroke="#fff" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"/>
          <path id="Vector-3" data-name="Vector" d="M0,0H.009" transform="translate(11.995 17)" fill="none" stroke="#fff" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/>
          <path id="Vector-4" data-name="Vector" d="M0,0H24V24H0Z" fill="none" opacity="0"/>
        </svg></i>${errorMessage}</div>`;
          return;
        }

        //geo code
        const myGeocoder = ymaps.geocode(
          regionName.replace(/\u0451/g, '\u0435').replace(/\u0401/g, '\u0415'),
          {
            results: 1,
          }
        );

        myGeocoder.then(
          (res) => {
            // first result, its coords and bounds
            let firstGeoObject = res.geoObjects.get(0);
            firstGeoObjectCoords = firstGeoObject.geometry.getCoordinates();
            bounds = firstGeoObject.properties.get('boundedBy');
            newBounds = bounds;

            //show options center coords
            let centerZoom = {
              center: firstGeoObjectCoords,
              zoom: 9,
            };

            if (options.params.panTo) {
              let c = options.params.panTo;
              if (typeof options.params.panTo === 'string') {
                c = options.params.panTo.split(',');
                c[0] = c[0] * 1;
                c[1] = c[1] * 1;
              }
              centerZoom = {
                center: c,
                zoom: 16,
              };
            }

            //map
            map = new ymaps.Map(
              'ydPopupMap',
              {
                ...centerZoom,
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
            objectManager.objects.options.set(
              'iconImageHref',
              './images/yandexPoint.svg'
              //'../widget/widget/yandexPoint.svg'
            );
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
              elemLoader(ydPopupMap, false);
              //map bounds
              if (!options.params.panTo) {
                map.setBounds(bounds, {
                  checkZoomRange: true,
                });
              }
              //events
              map.events.add('boundschange', onBoundsChange);
              map.events.add('click', () => {
                setPopupMode('map');
              });

              //filter
              setCheckedFilter();

              ydPopupFilterForm.addEventListener('click', (e) => {
                if (
                  e.target &&
                  e.target.classList.contains('yd-popup-list-filter-item')
                ) {
                  //if the item is last checked in a group

                  if (
                    !checkedFilter.some(
                      (checked) =>
                        checked.type === e.target.getAttribute('data-type') &&
                        checked.code !== e.target.getAttribute('data-code')
                    )
                  ) {
                    //show alert
                    return;
                  }

                  //set checked
                  e.target.classList.toggle(
                    'yd-popup-list-filter-item--checked'
                  );

                  //show filter
                  setCheckedFilter();
                  ydPopupFilterText.textContent = checkedFilter
                    .map((item) => item.name)
                    .join(', ');

                  //filter array
                  onFilter();
                }
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

            function setCheckedFilter() {
              checkedFilter = [];
              ydPopupFilterForm
                .querySelectorAll('.yd-popup-list-filter-item')
                .forEach((item) => {
                  if (
                    item.classList.contains(
                      'yd-popup-list-filter-item--checked'
                    )
                  ) {
                    checkedFilter.push({
                      type: item.getAttribute('data-type'),
                      code: item.getAttribute('data-code'),
                      name: item.textContent,
                    });
                  }
                });
            }

            function onFilter() {
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
                //if one of types & one of payments match

                return (
                  checkedFilter.some(
                    (f) => f.type === 'type' && f.code === point.type.code
                  ) &&
                  checkedFilter.some(
                    (f) =>
                      f.type === 'payment_methods' &&
                      point['payment_methods'].some((p) => p.code === f.code)
                  )
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
              formData.set('action', 'getPoints');
              formData.set(
                'fields',
                `lat-from=${bounds[0][0]}&lat-to=${bounds[1][0]}&lon-from=${bounds[0][1]}&lon-to=${bounds[1][1]}&payment=${payment}`
              );

              let controller = new AbortController();
              let response;

              setTimeout(() => {
                if (!response) {
                  controller.abort();
                }
              }, fetchTimeout);

              elemLoader(ydPopupMap, true);
              elemLoader(ydPopupWrapper, true);

              try {
                response = await fetch(window.twinpxYadeliveryFetchPointsURL, {
                  method: 'POST',
                  body: formData,
                  signal: controller.signal,
                });
                let result = await response.json();

                //remove preloader
                elemLoader(ydPopupMap, false);
                elemLoader(ydPopupWrapper, false);

                if (result && typeof result === 'object') {
                  if (result.status === 'success') {
                    if (result.errors) {
                      pointsError(result.errors[0].message);
                    } else {
                      if (result.data.points) {
                        //fill pointsArray
                        pointsArray = result.data.points;

                        //list
                        let pointsFlag,
                          objectsArray = [];

                        result.data.points.forEach((point) => {
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
                          pointsError(
                            window.twinpxYadeliveryErrors.emptyPoints
                          );
                        }

                        //map bounds
                        if (map) {
                          centerCoords = map.getCenter();
                        }

                        //if the map was moved while offices were loading
                        //or it's opened with panto param (list button)
                        if (
                          ydPopupWrapper.classList.contains(
                            'yd-popup-list-wrapper--sorted'
                          )
                        ) {
                          onBoundsChange();
                        }
                        if (options.params.id) {
                          firstBound = false;
                          newBounds = map.getBounds();
                          onBoundsChange();
                        }

                        //show detail
                        if (options.params.id) {
                          let pointObject = pointsArray.find((p) => {
                            return p.id === options.params.id;
                          });

                          if (pointObject && typeof pointObject === 'string') {
                            pointObject = JSON.parse(pointObject);
                          }

                          if (pointObject) {
                            clickPlacemark(pointObject, map);
                          }
                        }
                      } else {
                        pointsError(window.twinpxYadeliveryErrors.emptyPoints);
                        elemLoader(ydPopupMap, false);
                        elemLoader(ydPopupWrapper, false);
                      }
                    }
                  } else {
                    pointsError(window.twinpxYadeliveryErrors.severError);
                    elemLoader(ydPopupMap, false);
                    elemLoader(ydPopupWrapper, false);
                  }
                }
              } catch (err) {
                pointsError(window.twinpxYadeliveryErrors.severError);
                elemLoader(ydPopupMap, false);
                elemLoader(ydPopupWrapper, false);
              }
            })();
          },
          (err) => {
            tokenOrApiKeyErrors(window.twinpxYadeliveryErrors.invalidApiKey);
            elemLoader(ydPopupMap, false);
            elemLoader(ydPopupWrapper, false);
          }
        );
      });
    }

    //back button
    ydPopupList
      .querySelector('.yd-popup-list__back')
      .addEventListener('click', (e) => {
        setPopupMode('list');
        //show sorted
        if (Object.values(pointsNodesArray).find((value) => value.sorted)) {
          ydPopupWrapper.classList.add('yd-popup-list-wrapper--sorted');
        }
      });
  }
};
