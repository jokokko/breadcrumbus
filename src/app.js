'use strict';

(async () => {

  class UriPart {
    constructor(partType, part, display = null) {
      this.partType = partType;
      this.part = part;
      this.display = display || part;
    }
  }

  function parseUri(url) {
    const uri = new URL(url);
    let host = new UriPart(contracts.UriPartHost, uri.origin, uri.hostname);
    const path = uri.pathname.match(/(.+?\/|.+)/g).filter(x => x.length > 1);
    const protocol = `${uri.protocol}//`;

    const parsedUri = tldts.parse(uri.hostname, { extractHostname: false });
    let subdomains = [];

    if (parsedUri.subdomain && !parsedUri.isIp) {
      const subdomainParts = parsedUri.subdomain.split('.');
      subdomains = subdomainParts.map((t, i, a) =>
        new UriPart(contracts.UriPartSubdomain, `${protocol}${[t, ...a.slice(i + 1)].join('.')}.${parsedUri.domain}`, `${t}.`)
      );
      host = new UriPart(contracts.UriPartHost, `${protocol}${parsedUri.domain}`, parsedUri.domain);
    }

    const pathParts = path.length > 0 ? path.reduce((acc, item) => {
      acc.items.push(new UriPart(contracts.UriParthPath, acc.uri += item, item));
      return acc;
    }, { items: [], uri: uri.origin }).items : [];

    const search = uri.search.split(/(?=&)/g).filter(t => t.length > 1);
    const searchParts = search.length > 0 ? search.reduce((acc, item) => {
      acc.items.push(new UriPart(contracts.UriPartSearch, acc.uri += item, item));
      return acc;
    }, { items: [], uri: `${uri.origin}${uri.pathname}` }).items : [];

    const hash = uri.hash === ''
      ? []
      : [new UriPart(contracts.UriPartHash, `${uri.origin}${uri.pathname}${uri.search}${uri.hash}`, uri.hash)];

    return {
      uriParts: [...subdomains, host, ...pathParts, ...searchParts, ...hash],
      uri,
    };
  }

  const HIDDEN = ['/', '#', '&'];

  function shouldShow(part) {
    return part.display && part.display.length > 0 && !HIDDEN.includes(part.display);
  }

  function crumbClass(partType) {
    switch (partType) {
      case contracts.UriPartSubdomain: return 'crumb crumb-sub';
      case contracts.UriPartHost:      return 'crumb crumb-host';
      case contracts.UriParthPath:     return 'crumb crumb-path';
      case contracts.UriPartSearch:    return 'crumb crumb-search';
      default:                         return 'crumb crumb-hash';
    }
  }

  function addListeners(el, collection, part, navigate) {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      navigate(collection, part);
    });
    el.addEventListener('mousedown', (e) => {
      if (e.button === 1) {
        e.preventDefault();
        navigate(collection, part, true);
      }
    });
  }

  function makeHorizontalItem(collection, part, navigate) {
    const span = document.createElement('span');
    span.className = 'crumb';
    const a = document.createElement('a');
    a.href = '#';
    a.textContent = part.display;
    span.appendChild(a);
    addListeners(a, collection, part, navigate);
    return span;
  }

  function makeVerticalItem(collection, part, navigate) {
    const a = document.createElement('a');
    a.href = '#';
    const span = document.createElement('span');
    span.className = crumbClass(part.partType);
    span.textContent = part.display;
    a.appendChild(span);
    addListeners(a, collection, part, navigate);
    return a;
  }

  function renderHorizontal(container, collections, navigate) {
    for (const c of collections) {
      const ul = document.createElement('ul');
      ul.className = 'crumbs';
      for (const p of c.uriParts.filter(shouldShow)) {
        const li = document.createElement('li');
        li.appendChild(makeHorizontalItem(c, p, navigate));
        ul.appendChild(li);
      }
      container.appendChild(ul);
    }
  }

  function renderVertical(container, collections, navigate) {
    for (const c of collections) {
      const ul = document.createElement('ul');
      ul.className = 'crumbs-v';
      for (const p of c.uriParts.filter(shouldShow)) {
        const li = document.createElement('li');
        li.appendChild(makeVerticalItem(c, p, navigate));
        ul.appendChild(li);
      }
      container.appendChild(ul);
    }
  }

  // Connect to background for navigation — failures here must not block rendering
  let port = null;
  try {
    port = browser.runtime.connect({ name: contracts.Port });
    port.onMessage.addListener((e) => {
      if (e.event === contracts.OpenURLCompleted) window.close();
    });
  } catch (e) {
    console.error('Port connection failed:', e);
  }

  function navigate(collection, part, newTab = false) {
    port?.postMessage({
      command: contracts.OpenURL,
      payload: { tabId: collection.id, container: collection.context, uri: part.part, newTab },
    });
  }

  const tabs = await browser.tabs.query({ currentWindow: true, active: true });
  if (!tabs || tabs.length === 0) return;

  const settings = await addinSettings.get() ?? {};

  const collections = tabs.map((tab) => {
    const parts = parseUri(tab.url);
    parts.id = tab.id;
    parts.context = tab.cookieStoreId;
    return parts;
  });

  const container = document.getElementById('crumb-container');

  // Default to horizontal if settings are missing
  if (settings[contracts.OptionBreadcrumbHorizontal] ?? true) {
    renderHorizontal(container, collections, navigate);
  }
  if (settings[contracts.OptionBreadcrumbVertical]) {
    renderVertical(container, collections, navigate);
  }

})();
