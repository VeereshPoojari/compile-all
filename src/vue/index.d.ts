import { DefineComponent } from 'vue';
import { CompileAllInstance, CompileAllOptions } from '../types';

export declare const CompileAllVue: DefineComponent<
  Partial<CompileAllOptions>,
  {
    getInstance: () => CompileAllInstance | null;
    run: () => Promise<any> | undefined;
    stop: () => CompileAllInstance | undefined;
    getCode: () => string | undefined;
    setCode: (code: string) => CompileAllInstance | undefined;
    getLanguage: () => string | undefined;
    setLanguage: (lang: string) => CompileAllInstance | undefined;
    getLayout: () => string | undefined;
    setLayout: (layout: string) => CompileAllInstance | undefined;
    getTemplates: () => any[] | undefined;
    loadTemplate: (indexOrLabel: number | string) => CompileAllInstance | undefined;
  }
>;

export default CompileAllVue;
