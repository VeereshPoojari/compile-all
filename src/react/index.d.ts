import * as React from 'react';
import { CompileAllInstance, CompileAllOptions } from '../types';

export interface CompileAllReactProps extends Partial<CompileAllOptions> {
  className?: string;
  style?: React.CSSProperties;
}

export declare const CompileAllComponent: React.ForwardRefExoticComponent<
  CompileAllReactProps & React.RefAttributes<CompileAllInstance>
>;

export default CompileAllComponent;
