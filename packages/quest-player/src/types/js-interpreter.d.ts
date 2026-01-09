// Type declaration for js-interpreter
declare module 'js-interpreter' {
  class Interpreter {
    constructor(code: string, initFunc?: (interpreter: Interpreter, globalObject: object) => void);
    run(): boolean;
    step(): boolean;
    appendCode(code: string): void;
    createNativeFunction(nativeFunc: (...args: any[]) => any): object;
    createAsyncFunction(asyncFunc: (...args: any[]) => any): object;
    setProperty(obj: object, name: string, value: any, descriptor?: object): void;
    getProperty(obj: object, name: string): any;
    nativeToPseudo(nativeObj: any): any;
    pseudoToNative(pseudoObj: any): any;
    getScope(): object;
    getStateStack(): any[];
    value: any;
  }
  export = Interpreter;
}
