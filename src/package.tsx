import React from 'react';
import { createStore, compose, applyMiddleware, combineReducers } from "redux";
import { RouteProps, Switch, Route, BrowserRouter as Router } from 'react-router-dom';
import { ArkModule } from './module';

export class ArkPackage<ModuleType> {

    // Member properties
    modules: ModuleType
    RouterElement: React.FunctionComponent
    routes: RouteProps[]
    store: any

    constructor() {
        this.modules = {} as any;
        this.RouterElement = null;
        this.routes = [];
        this.store = null;
    }

    registerModule(id: string, _module: ArkModule) {
        // Register views
        // @ts-ignore
        this.modules[id] = _module;
    }

    getModuleByType<ModuleType = any>(type: string): ModuleType {
        Object.keys(this.modules).forEach((id) => {
            if ((this.modules as any)[id].type === type) {
                return (this.modules as any)[id] as ModuleType
            }
        })

        return null;
    }

    getStore(enableReduxDevTool: boolean = false): any {
        if (this.store) {
            return this.store;
        }

        // Aggregate reducers from all modules
        const reducerMap: any = {};
        Object.keys(this.modules).forEach((id) => {
            const _reducer: any = (this.modules as any)[id].getReducer();
            if (_reducer) {
                reducerMap[id] = _reducer;
            }
        });

        let composeScript = null;
        let middlewares: any[] = [];
        if (enableReduxDevTool) {
            composeScript = compose(applyMiddleware(...middlewares));
            if ((window as any).__REDUX_DEVTOOLS_EXTENSION__) {
                composeScript = compose(
                    applyMiddleware(...middlewares),
                    (window as any).__REDUX_DEVTOOLS_EXTENSION__()
                );
            }
        } else {
            composeScript = compose(applyMiddleware(...middlewares));
        }

        this.store = createStore(combineReducers(reducerMap), composeScript);
        return this.store;
    }

    initialize(cb: (err: Error, Routes: React.FunctionComponent, options?: PackageOptions) => void) {
        // Do awesome work
        this.RouterElement = (props) => (
            <Router>
                <Switch>
                    {
                        this.routes.map((route: any, index: number) => {
                            return <Route key={index} {...route} />
                        })
                    }
                </Switch>
            </Router>
        )

        cb(null, this.RouterElement, {
            getStore: (enableReduxDevTool: boolean = false) => this.getStore(enableReduxDevTool)
        });
    }
}

export type PackageOptions = {
    getStore: (enableReduxDevTool?: boolean) => any
}