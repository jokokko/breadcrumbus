'use strict';

(async () => {

  const categories = [
    {
      label: browser.i18n.getMessage('general'),
      options: [
        { key: contracts.OptionBreadcrumbVertical,   label: browser.i18n.getMessage('option_show_crumbs_vertical') },
        { key: contracts.OptionBreadcrumbHorizontal, label: browser.i18n.getMessage('option_show_crumbs_horizontal') },
        { key: contracts.OptionHidePageAction,       label: browser.i18n.getMessage('option_hide_page_action') },
      ],
      enums: [
        {
          label: browser.i18n.getMessage('option_theme'),
          key: contracts.OptionTheme,
          values: [
            { label: 'Original',   value: 'original' },
            { label: 'Chain Link', value: 'chainlink' },
          ],
        },
      ],
    },
  ];

  let settings = await addinSettings.get();

  async function save() {
    await addinSettings.set(settings);
    await browser.runtime.sendMessage({ event: contracts.SettingsUpdated, payload: settings });
  }

  const container = document.getElementById('settings-container');

  for (const c of categories) {
    const panel = document.createElement('div');
    panel.className = 'option-group';

    const heading = document.createElement('div');
    heading.className = 'option-group-title';
    heading.textContent = c.label;
    panel.appendChild(heading);

    const body = document.createElement('div');
    body.className = 'option-group-body';

    for (const item of c.options) {
      const div = document.createElement('div');

      const input = document.createElement('input');
      input.type = 'checkbox';
      input.id = item.key;
      input.checked = !!settings[item.key];
      input.addEventListener('change', () => {
        settings[item.key] = input.checked;
        save();
      });

      const label = document.createElement('label');
      label.htmlFor = item.key;
      label.textContent = ' ' + item.label;

      div.appendChild(input);
      div.appendChild(label);
      body.appendChild(div);
    }

    for (const en of c.enums) {
      const div = document.createElement('div');

      const label = document.createElement('label');
      label.htmlFor = en.key;
      label.textContent = en.label;

      const select = document.createElement('select');
      select.id = en.key;
      for (const e of en.values) {
        const option = document.createElement('option');
        option.value = e.value;
        option.textContent = e.label;
        if (settings[en.key] === e.value) option.selected = true;
        select.appendChild(option);
      }
      select.addEventListener('change', () => {
        settings[en.key] = select.value;
        save();
      });

      div.appendChild(label);
      div.appendChild(select);
      body.appendChild(div);
    }

    panel.appendChild(body);
    container.appendChild(panel);
  }


})();
