window.twpxYadeliveryLocation = {
  createWidget(options, callback) {
    fetchLocation();

    async function fetchLocation() {
      const root = document.getElementById(options.containerId);

      //html
      let responseHTML = await fetch(options.fetchLocationURL.html);
      let html = await responseHTML.text();

      root.innerHTML = html;

      //stye
      let responseCSS = await fetch(options.fetchLocationURL.css);
      let css = await responseCSS.text();

      const style = document.createElement('style');
      style.textContent = css;

      document.querySelector('head').append(style);

      //script
      let responseJS = await fetch(options.fetchLocationURL.js);
      let js = await responseJS.text();

      const script = document.createElement('script');
      script.textContent = js;

      document.querySelector('body').append(script);

      window.twpxYadeliveryLocation.locationJS(options.params);

      callback();
    }
  },
};

document.dispatchEvent(new Event('twpxYadeliveryLocationLoad'));
