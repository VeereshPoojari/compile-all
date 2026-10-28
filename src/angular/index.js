import { CompileAll } from '../core/CompileAll.js';

/**
 * Universal Angular Component Class
 * Compatible with Angular 12+ (Standalone & NgModule)
 */
export class CompileAllAngular {
  constructor(elementRef) {
    this.elementRef = elementRef;
    this.instance = null;
    this.language = 'javascript';
    this.code = undefined;
    this.stdin = '';
    this.theme = 'dark';
    this.layout = 'split-h';
    this.readOnly = false;
    this.options = {};
    this.onRunStart = null;
    this.onRunEnd = null;
    this.onStateChange = null;
  }

  ngOnInit() {
    if (this.elementRef && this.elementRef.nativeElement) {
      const container = this.elementRef.nativeElement;
      this.instance = new CompileAll(container, {
        language: this.language,
        code: this.code,
        stdin: this.stdin,
        theme: this.theme,
        layout: this.layout,
        readOnly: this.readOnly,
        onRunStart: (data) => {
          if (typeof this.onRunStart === 'function') this.onRunStart(data);
        },
        onRunEnd: (data) => {
          if (typeof this.onRunEnd === 'function') this.onRunEnd(data);
        },
        onStateChange: (state) => {
          if (typeof this.onStateChange === 'function') this.onStateChange(state);
        },
        ...this.options
      });
    }
  }

  ngOnChanges(changes) {
    if (!this.instance) return;

    if (changes.code && changes.code.currentValue !== undefined && changes.code.currentValue !== this.instance.getCode()) {
      this.instance.setCode(changes.code.currentValue);
    }
    if (changes.language && changes.language.currentValue && changes.language.currentValue !== this.instance.getLanguage()) {
      this.instance.setLanguage(changes.language.currentValue);
    }
    if (changes.theme && changes.theme.currentValue && changes.theme.currentValue !== this.instance.getTheme()) {
      this.instance.setTheme(changes.theme.currentValue);
    }
    if (changes.layout && changes.layout.currentValue && changes.layout.currentValue !== this.instance.getLayout()) {
      this.instance.setLayout(changes.layout.currentValue);
    }
  }

  ngOnDestroy() {
    if (this.instance) {
      this.instance.destroy();
      this.instance = null;
    }
  }

  run() {
    return this.instance?.run();
  }

  stop() {
    return this.instance?.stop();
  }

  getCode() {
    return this.instance?.getCode();
  }

  setCode(c) {
    return this.instance?.setCode(c);
  }

  getLanguage() {
    return this.instance?.getLanguage();
  }

  setLanguage(l) {
    return this.instance?.setLanguage(l);
  }

  getLayout() {
    return this.instance?.getLayout();
  }

  setLayout(lay) {
    return this.instance?.setLayout(lay);
  }

  getTemplates() {
    return this.instance?.getTemplates();
  }

  loadTemplate(t) {
    return this.instance?.loadTemplate(t);
  }

  getInstance() {
    return this.instance;
  }
}

export default CompileAllAngular;
