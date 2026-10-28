import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { CompileAll } from '../core/CompileAll.js';

export const CompileAllComponent = forwardRef(function CompileAllComponent(props, ref) {
  const containerRef = useRef(null);
  const instanceRef = useRef(null);

  useImperativeHandle(ref, () => instanceRef.current, []);

  // Mount & Teardown
  useEffect(() => {
    if (typeof window === 'undefined' || !containerRef.current) return;

    const instance = new CompileAll(containerRef.current, {
      ...props,
      onRunStart: (data) => props.onRunStart && props.onRunStart(data),
      onRunEnd: (data) => props.onRunEnd && props.onRunEnd(data),
      onStateChange: (state) => props.onStateChange && props.onStateChange(state)
    });

    instanceRef.current = instance;

    return () => {
      if (instanceRef.current) {
        instanceRef.current.destroy();
        instanceRef.current = null;
      }
    };
  }, []);

  // Reactive prop synchronization without re-mounting
  useEffect(() => {
    if (instanceRef.current && props.code !== undefined && props.code !== instanceRef.current.getCode()) {
      instanceRef.current.setCode(props.code);
    }
  }, [props.code]);

  useEffect(() => {
    if (instanceRef.current && props.language && props.language !== instanceRef.current.getLanguage()) {
      instanceRef.current.setLanguage(props.language);
    }
  }, [props.language]);

  useEffect(() => {
    if (instanceRef.current && props.theme && props.theme !== instanceRef.current.getTheme()) {
      instanceRef.current.setTheme(props.theme);
    }
  }, [props.theme]);

  useEffect(() => {
    if (instanceRef.current && props.layout && props.layout !== instanceRef.current.getLayout()) {
      instanceRef.current.setLayout(props.layout);
    }
  }, [props.layout]);

  return React.createElement('div', {
    ref: containerRef,
    className: `cpa-react-wrapper ${props.className || ''}`.trim(),
    style: { width: '100%', height: '100%', ...props.style }
  });
});

CompileAllComponent.displayName = 'CompileAll';
export default CompileAllComponent;
