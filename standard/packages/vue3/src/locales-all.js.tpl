{{#each localeCodes}}
import l{{@index}} from '@fullcalendar/vanilla/locales/{{this}}';
{{/each}}

export default [
  {{#each localeCodes}}l{{@index}}, {{/each}}
];
