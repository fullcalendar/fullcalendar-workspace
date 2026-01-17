import { globalLocales } from '@fullcalendar/vanilla';

{{#each localeCodes}}
import l{{@index}} from '@fullcalendar/vanilla/locales/{{this}}';
{{/each}}

globalLocales.push(
  {{#each localeCodes}}l{{@index}}, {{/each}}
);
