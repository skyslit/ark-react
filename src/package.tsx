import React from 'react';
import { createStore, compose, applyMiddleware, combineReducers, Store } from "redux";
import { Switch, Route, BrowserRouter as Router } from 'react-router-dom';
import { ArkModule } from './module';
import { IArkPackage, PackageRouteConfig, ArkPackageOption } from './types';

export type PackageStateType<ModuleType> = {
    // @ts-ignore
    [k in keyof ModuleType]: ModuleType[k]["state"]
}

export type ConfigEnvironment<T> = {
    default: T
    development?: T
    staging?: T
    production?: T
    [k: string]: Partial<T>
}

export type BaseConfigType = {
    baseUrl?: string
}

export class ArkPackage<ModuleType = any, ConfigType extends BaseConfigType = BaseConfigType> implements IArkPackage<ModuleType> {
    static instance: ArkPackage;
    static createInstance<ModuleType>(): ArkPackage<ModuleType> {
        return ArkPackage.getInstance();
    }
    static getInstance<ModuleType>(): ArkPackage<ModuleType> {
        if (!ArkPackage.instance) {
            ArkPackage.instance = new ArkPackage<ModuleType>();
            return ArkPackage.instance as ArkPackage<ModuleType>;
        }

        return ArkPackage.instance as ArkPackage<ModuleType>;
    }

    modules: ModuleType = {} as any
    routeConfig: PackageRouteConfig[] = [];
    store: Store<PackageStateType<ModuleType>> = null;
    configOpts: ConfigEnvironment<ConfigType> = { 'default': {} as any };
    configMode: string = 'default';

    Router: React.FunctionComponent

    registerModule(id: string, _module: ArkModule) {
        // Register views
        _module.id = id;
        _module.package = this;
        _module.normalizeActionTypes();
        _module.attachContextToComponents(_module.components);
        _module.attachContextToComponents(_module.views);

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

    getConfig(): Readonly<ConfigType> {
        if (this.configOpts[this.configMode]) {
            return this.configOpts[this.configMode] as any;
        } else {
            return this.configOpts['default'];
        }
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
