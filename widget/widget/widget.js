window.twpxYadeliveryWidget = {
  createWidget(options, callback) {
    (async function () {
      //script
      let responseJS = await fetch(window.twinpxYadeliveryFetchWidget.js);
      let js = await responseJS.text();

      const script = document.createElement('script');
      script.textContent = js;

      document.querySelector('body').append(script);

      window.twpxYadeliveryWidget.JS(options);

      //stye
      let responseCSS = await fetch(window.twinpxYadeliveryFetchWidget.css);
      let css = await responseCSS.text();

      const style = document.createElement('style');
      style.textContent = css;

      document.querySelector('head').append(style);

      callback();
    })();
  },
};

document.dispatchEvent(new Event('twpxYadeliveryWidgetLoad'));
