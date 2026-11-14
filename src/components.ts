// Pure ECS declaration entry for the Estella editor.
// Keep startup side effects in src/main.ts.
import { defineComponent } from 'esengine';

export const OutpostRunTag = defineComponent('OutpostRunTag', {
    sol: 1,
    phase: 'event',
    planet: 'mars',
});
