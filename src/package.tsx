import React from 'react';
import { createStore, compose, applyMiddleware, combineReducers, Store } from "redux";
import { Switch, Route, BrowserRouter, StaticRouter } from 'react-router-dom';
import Axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
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

export type ServiceProviderBase = 'Main'
export type ServiceProvider<Providers> = {
    // @ts-ignore
    [k in Providers]: AxiosInstance
}
export type ServiceProviderConfiguration<Providers> = {
    // @ts-ignore
    [k in Providers]: AxiosRequestConfig
}

export class ArkPackage<ModuleType = any, ConfigType extends BaseConfigType = BaseConfigType, ServiceProviderType = ServiceProviderBase> implements IArkPackage<ModuleType> {
    static instance: any;
    static getInstance<ModuleType = any, ConfigType extends BaseConfigType = BaseConfigType, ServiceProviderType = ServiceProviderBase>(): ArkPackage<ModuleType, ConfigType, ServiceProviderType> {
        if (!ArkPackage.instance) {
            ArkPackage.instance = new ArkPackage<ModuleType, ConfigType, ServiceProviderType>();
            return ArkPackage.instance as ArkPackage<ModuleType, ConfigType, ServiceProviderType>;
        }

        return ArkPackage.instance as ArkPackage<ModuleType, ConfigType, ServiceProviderType>;
    }

    modules: ModuleType = {} as any
    routeConfig: PackageRouteConfig[] = [];
    store: Store<PackageStateType<ModuleType>> = null;
    configOpts: ConfigEnvironment<ConfigType> = { 'default': {} as any };
    configMode: string = 'default';
    private _serviceProviders: ServiceProvider<ServiceProviderType> = {} as any;
    private _serviceProviderConfigurations: ServiceProviderConfiguration<ServiceProviderType> = {} as any;

    Router: React.FunctionComponent<{ location?: string }>

    registerModule(id: string, _module: ArkModule) {
        // Register views
        _module.id = id;
        _module.package = this as any;
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

        if (Object.keys(reducerMap).length < 1) {
            console.warn('None of your modules use a valid reducer. So please consider NOT using setupStore() in your code')
        }

        let composeScript = null;
        let middlewares: any[] = [];
        if (enableReduxDevTool) {
            composeScript = compose(applyMiddleware(...middlewares));
            if (typeof window !== 'undefined') {
                if ((window as any).__REDUX_DEVTOOLS_EXTENSION__) {
                    composeScript = compose(
                        applyMiddleware(...middlewares),
                        (window as any).__REDUX_DEVTOOLS_EXTENSION__()
                    );
                }
            }
        } else {
            composeScript = compose(applyMiddleware(...middlewares));
        }

        this.store = createStore<PackageStateType<ModuleType>, any, any, any>(combineReducers<PackageStateType<ModuleType>>(reducerMap), composeScript);
        return this.store;
    }

    private __normalizeProviderConfiguration(config: AxiosRequestConfig): AxiosRequestConfig {
        config.baseURL = this.getConfig().baseUrl;
        return config;
    }

    private _getServiceProviderConfiguration(provider: ServiceProviderType): AxiosRequestConfig {
        /** Set default axios configuration such as default baseValue */
        // @ts-ignore
        this._serviceProviderConfigurations[provider] = this.__normalizeProviderConfiguration({});

        /** Try to fetch configuration from provided values */
        // @ts-ignore
        if (this._serviceProviderConfigurations[provider]) {
            // @ts-ignore
            return this._serviceProviderConfigurations[provider];
        }

        // @ts-ignore
        return this._serviceProviderConfigurations[provider];
    }

    getServiceProvider(provider: ServiceProviderBase): AxiosInstance {
        // @ts-ignore
        if (this._serviceProviders[provider]) {
            // @ts-ignore
            return this._serviceProviders[provider];
        }

        // @ts-ignore
        this._serviceProviders[provider] = Axios.create(this._getServiceProviderConfiguration(provider));
        // @ts-ignore
        return this._serviceProviders[provider];
    }

    initialize(mode: 'Browser' | 'Server', done: (err: Error, options: ArkPackageOption<ModuleType, PackageStateType<ModuleType>>) => void) {
        const Router: any = mode === 'Browser' ? BrowserRouter : StaticRouter
        this.Router = (props) => (
            <Router location={props.location}>
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
