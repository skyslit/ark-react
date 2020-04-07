import React from 'react';
import { createStore, compose, applyMiddleware, combineReducers, Store, AnyAction, Reducer } from "redux";
import { Switch, Route, BrowserRouter, StaticRouter } from 'react-router-dom';
import Axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { ArkModule } from './module';
import { IArkPackage, PackageRouteConfig, ArkPackageOption, IArkModule } from './types';

type CORE_PACKAGE_ID_TYPE = '__CORE_PACKAGE';
export const CORE_PACKAGE_ID: CORE_PACKAGE_ID_TYPE = '__CORE_PACKAGE';

export type PackageGlobalState = {
    isAuthenticated: boolean
    token: string
    userInfo: any
}

export const PackageStoreType = {
    CORE_SET_CURRENT_USER: `${CORE_PACKAGE_ID}_SET_CURRENT_USER`
}

const initialState: PackageGlobalState = {
    isAuthenticated: false,
    token: null,
    userInfo: null
}

const createPackageReducer = (): Reducer => (state: Partial<PackageGlobalState> = initialState, action: AnyAction) => {
    switch (action.type) {
        case PackageStoreType.CORE_SET_CURRENT_USER: {
            const { isAuthenticated, userInfo, token } = action.payload;
            return Object.assign({}, state, {
                isAuthenticated,
                userInfo,
                token
            })
        }
        default: {
            return state;
        }
    }
}

export type PackageStateType<ModuleType> = {
    // @ts-ignore
    [k in keyof ModuleType]: ModuleType[k]["state"]
}

export type ConfigEnvironment<T> = {
    default: T
    development?: Partial<T>
    staging?: Partial<T>
    production?: Partial<T>
    [k: string]: Partial<T>
}

export type BaseConfigType<SPT = 'Main'> = Record<Extract<SPT, string>, Partial<AxiosRequestConfig>>

export type ServiceProviderBase = 'Main'
export type ServiceProvider<Providers> = {
    // @ts-ignore
    [k in Providers]: AxiosInstance
}
export type ServiceProviderConfiguration<Providers> = {
    // @ts-ignore
    [k in Providers]: AxiosRequestConfig
}

export type ModuleServiceProviderMap<ModuleType> = {
    [k in keyof ModuleType]?: {
        // @ts-ignore
        [y in keyof ModuleType[k]["providers"]]?: AxiosInstance
    }
}

export type PackageConfiguration = {
    autoConfigureInitialRoutes: boolean
}

export class ArkPackage<ModuleType = any, ConfigType = BaseConfigType, ServiceProviderType = ServiceProviderBase> implements IArkPackage<ModuleType> {
    static instance: any;
    static getInstance<ModuleType = any, ConfigType = BaseConfigType, ServiceProviderType = ServiceProviderBase>(): ArkPackage<ModuleType, ConfigType, ServiceProviderType> {
        if (!ArkPackage.instance) {
            ArkPackage.instance = new ArkPackage<ModuleType, ConfigType, ServiceProviderType>();
            return ArkPackage.instance as ArkPackage<ModuleType, ConfigType, ServiceProviderType>;
        }

        return ArkPackage.instance as ArkPackage<ModuleType, ConfigType, ServiceProviderType>;
    }

    modules: ModuleType = {} as any
    routeConfig: PackageRouteConfig[] = [];
    store: Store<Record<CORE_PACKAGE_ID_TYPE, PackageGlobalState> & PackageStateType<ModuleType>> = null;
    configOpts: ConfigEnvironment<ConfigType & BaseConfigType<ServiceProviderType>> = { 'default': {} as any };
    configMode: string = 'default';
    serviceProviderModuleMap: ModuleServiceProviderMap<ModuleType> = {} as any;
    private packageConfiguration: Partial<PackageConfiguration> = {} as any;
    private _serviceProviders: ServiceProvider<ServiceProviderType> = {} as any;
    private _serviceProviderConfigurations: ServiceProviderConfiguration<ServiceProviderType> = {} as any;

    Router: React.FunctionComponent<{ location?: string }>

    configure(opts: Partial<PackageConfiguration>) {
        this.packageConfiguration = opts;
    }

    private getPackageConfiguration(): Readonly<PackageConfiguration> {
        return Object.assign<Partial<PackageConfiguration>, any>({
            autoConfigureInitialRoutes: false
        }, this.packageConfiguration);
    }

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
            return Object.assign({}, this.configOpts['default'], this.configOpts[this.configMode] as any);
        } else {
            return this.configOpts['default'];
        }
    }

    setupStore(enableReduxDevTool: boolean = false): Store<PackageStateType<ModuleType>> {
        if (this.store) {
            return this.store;
        }

        // Aggregate reducers from all modules
        const reducerMap: any = {
            [CORE_PACKAGE_ID]: createPackageReducer()
        };
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

    private _getServiceProviderConfiguration(provider: ServiceProviderType): AxiosRequestConfig {
        // @ts-ignore
        if (this.getConfig()[provider]) {
            // @ts-ignore
            return this.getConfig()[provider] as AxiosRequestConfig;
        }

        return {}
    }

    _resolveServiceProvider(moduleId: string, providerId: string) {
        // @ts-ignore
        if (this.serviceProviderModuleMap[moduleId]) {
            // @ts-ignore
            if (this.serviceProviderModuleMap[moduleId][providerId]) {
                // @ts-ignore
                return this.serviceProviderModuleMap[moduleId][providerId];
            }
        }

        // @ts-ignore
        return this.getServiceProvider('Main');
    }

    getServiceProvider(provider: ServiceProviderType): AxiosInstance {
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

    private _initializeRoutes(module: ArkModule) {
        const config = this.getPackageConfiguration();
        if (config.autoConfigureInitialRoutes && config.autoConfigureInitialRoutes === true) {
            const defaultRoutes = module.getDefaultRoutes();
            if (Array.isArray(defaultRoutes)) {
                this.routeConfig.push(...defaultRoutes);
            }
        }
    }

    private _initializeModules() {
        Object.keys(this.modules).forEach(module => {
            // @ts-ignore
            if (this.modules[module]) {
                this._initializeRoutes((this.modules as any)[module]);
                // @ts-ignore
                this.modules[module].main();
            }
        })
    }

    initialize(mode: 'Browser' | 'Server', done: (err: Error, options: ArkPackageOption<ModuleType, PackageStateType<ModuleType>>) => void) {
        this._initializeModules();
        
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
