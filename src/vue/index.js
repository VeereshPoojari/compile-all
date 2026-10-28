import { defineComponent, ref, onMounted, onBeforeUnmount, watch, h } from 'vue';
import { CompileAll } from '../core/CompileAll.js';

export const CompileAllVue = defineComponent({
  name: 'CompileAllVue',
  props: {
    language: { type: String, default: 'javascript' },
    code: { type: String, default: undefined },
    stdin: { type: String, default: '' },
    theme: { type: String, default: 'dark' },
    layout: { type: String, default: 'split-h' },
    readOnly: { type: Boolean, default: false },
    options: { type: Object, default: () => ({}) }
  },
  emits: ['runStart', 'runEnd', 'stateChange'],
  setup(props, { emit, expose }) {
    const containerRef = ref(null);
    let instance = null;

    expose({
      getInstance: () => instance,
      run: () => instance?.run(),
      stop: () => instance?.stop(),
      getCode: () => instance?.getCode(),
      setCode: (c) => instance?.setCode(c),
      getLanguage: () => instance?.getLanguage(),
      setLanguage: (l) => instance?.setLanguage(l),
      getLayout: () => instance?.getLayout(),
      setLayout: (lay) => instance?.setLayout(lay),
      getTemplates: () => instance?.getTemplates(),
      loadTemplate: (t) => instance?.loadTemplate(t)
    });

    onMounted(() => {
      if (!containerRef.value) return;

      instance = new CompileAll(containerRef.value, {
        language: props.language,
        code: props.code,
        stdin: props.stdin,
        theme: props.theme,
        layout: props.layout,
        readOnly: props.readOnly,
        onRunStart: (data) => emit('runStart', data),
        onRunEnd: (data) => emit('runEnd', data),
        onStateChange: (state) => emit('stateChange', state),
        ...props.options
      });
    });

    watch(() => props.code, (newCode) => {
      if (instance && newCode !== undefined && newCode !== instance.getCode()) {
        instance.setCode(newCode);
      }
    });

    watch(() => props.language, (newLang) => {
      if (instance && newLang && newLang !== instance.getLanguage()) {
        instance.setLanguage(newLang);
      }
    });

    watch(() => props.theme, (newTheme) => {
      if (instance && newTheme && newTheme !== instance.getTheme()) {
        instance.setTheme(newTheme);
      }
    });

    watch(() => props.layout, (newLayout) => {
      if (instance && newLayout && newLayout !== instance.getLayout()) {
        instance.setLayout(newLayout);
      }
    });

    onBeforeUnmount(() => {
      if (instance) {
        instance.destroy();
        instance = null;
      }
    });

    return () => h('div', {
      ref: containerRef,
      style: { width: '100%', height: '100%' }
    });
  }
});

export default CompileAllVue;
