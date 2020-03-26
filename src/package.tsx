import React from 'react';
import { createStore, compose, applyMiddleware, combineReducers, Store } from "redux";
import { Switch, Route, BrowserRouter as Router } from 'react-router-dom';
import { ArkModule } from './module';
import { IArkPackage, PackageRouteConfig, ArkPackageOption } from './types';

export type PackageStateType<ModuleType> = {
    // @ts-ignore
    [k in keyof ModuleType]: ModuleType[k]["state"]
}

export class ArkPackage<ModuleType = any> implements IArkPackage<ModuleType> {
    
    modules: ModuleType = {} as any
    routeConfig: PackageRouteConfig[] = [];
    store: Store<PackageStateType<ModuleType>> = null;

    Router: React.FunctionComponent

    registerModule(id: string, _module: ArkModule) {
        // Register views
        _module.id = id;
        _module.package = this;
        _module.normalizeActionTypes();

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

    setupStore(enableReduxDevTool: boolean = false): Store<PackageStateType<ModuleType>> {
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

        this.store = createStore<PackageStateType<ModuleType>, any, any, any>(combineReducers<PackageStateType<ModuleType>>(reducerMap), composeScript);
        return this.store;
    }

    initialize(done: (err: Error, options: ArkPackageOption<ModuleType, PackageStateType<ModuleType>>) => void) {
        this.Router = (props) => (
            <Router>
                <Switch>
                    {
                        this.routeConfig.map((route: PackageRouteConfig, index: number) => {
                            return <Route key={index} {...route} />
                        })
                    }
                </Switch>
            </Router>
        )

        done(null, this as any);
    }
}
