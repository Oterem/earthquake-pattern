import React from 'react';

const Context = React.createContext();

export function MyContext({ store, children }) {
    return <Context.Provider value={store}>
        {children}
    </Context.Provider>
}

MyContext.Context = Context;
