// Type declaration for fengari-web library
declare module 'fengari-web' {
  export const lua: {
    lua_pushstring: (L: any, s: string) => void;
    lua_settable: (L: any, idx: number) => void;
    lua_tojsstring: (L: any, idx: number) => string;
    LUA_GLOBALSINDEX: number;
  };
  export const lauxlib: {
    luaL_newstate: () => any;
    luaL_dostring: (L: any, s: Uint8Array) => number;
  };
  export const lualib: {
    luaL_openlibs: (L: any) => void;
  };
  export const interop: {
    push: (L: any, value: any) => void;
  };
}
