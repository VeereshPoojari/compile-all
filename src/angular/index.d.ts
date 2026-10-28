import { ElementRef, EventEmitter, OnInit, OnDestroy, OnChanges, SimpleChanges } from '@angular/core';
import { CompileAllInstance, CompileAllOptions } from '../types';

export declare class CompileAllAngular implements OnInit, OnDestroy, OnChanges {
  language: string;
  code?: string;
  stdin: string;
  theme: string;
  layout: string;
  readOnly: boolean;
  options: Partial<CompileAllOptions>;

  runStart: EventEmitter<any>;
  runEnd: EventEmitter<any>;
  stateChange: EventEmitter<any>;

  private instance: CompileAllInstance | null;
  constructor(el: ElementRef);

  ngOnInit(): void;
  ngOnChanges(changes: SimpleChanges): void;
  ngOnDestroy(): void;

  run(): Promise<any> | undefined;
  stop(): CompileAllInstance | undefined;
  getCode(): string | undefined;
  setCode(code: string): CompileAllInstance | undefined;
  getLanguage(): string | undefined;
  setLanguage(lang: string): CompileAllInstance | undefined;
  getLayout(): string | undefined;
  setLayout(layout: string): CompileAllInstance | undefined;
  getTemplates(): any[] | undefined;
  loadTemplate(indexOrLabel: number | string): CompileAllInstance | undefined;
  getInstance(): CompileAllInstance | null;
}
