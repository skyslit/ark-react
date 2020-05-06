import React from 'react';
import { createStore, compose, applyMiddleware, combineReducers, Store, AnyAction, Reducer } from "redux";
import { RouteProps, Route, Redirect } from 'react-router-dom';
import { i18n, InitOptions, ThirdPartyModule } from 'i18next';
import { I18nextProviderProps } from 'react-i18next';
import Axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { ArkModule } from './module';
import { IArkPackage, PackageRouteConfig, ArkPackageOption, ConditionalRouteProps } from './types';
import queryString from 'query-string';
import { loadTheme, removeThemeLink } from './browser';
import { AlertModal } from './components';
import { ToastProvider, ToastModule, CORE_TOAST_PACKAGE_ID, CORE_TOAST_PACKAGE_ID_TYPE, ToastStateType } from './toast';
import { stat } from 'fs';

type CORE_PACKAGE_ID_TYPE = '__CORE_PACKAGE';
export const CORE_PACKAGE_ID: CORE_PACKAGE_ID_TYPE = '__CORE_PACKAGE';

export type PackageGlobalState = {
    hasInitialized: boolean
    isAuthenticated: boolean
    token: string
    userInfo: any
    currentThemeId: string
    currentThemeType: 'light' | 'dark'
    isThemeChanging: boolean

    // Global Alerts
    errorAlert: {
        isOpen?: boolean
        title?: string
        message?: string
        canCloseManually?: boolean
    }
    waitAlert: {
        isOpen?: boolean
        title?: string
        message?: string
        canCloseManually?: boolean
    }
    messageAlert: {
        isOpen?: boolean
        title?: string
        message?: string
        canCloseManually?: boolean
    }
}

export const PackageStoreType = {
    CORE_INITIALIZE: `${CORE_PACKAGE_ID}_INITIALIZE`,
    CORE_SET_CURRENT_USER: `${CORE_PACKAGE_ID}_SET_CURRENT_USER`,
    CORE_SET_THEME: `${CORE_PACKAGE_ID}_SET_THEME`,
    CORE_SET_ERROR: `${CORE_PACKAGE_ID}_SET_ERROR`,
    CORE_SET_WAIT: `${CORE_PACKAGE_ID}_SET_WAIT`,
    CORE_SET_MSG: `${CORE_PACKAGE_ID}_SET_MSG`,
    CORE_CLEAR_ALERT: `${CORE_PACKAGE_ID}_CLEAR_ALERT`,
}

const initialState: PackageGlobalState = {
    hasInitialized: false,
    isAuthenticated: false,
    token: null,
    userInfo: null,
    currentThemeId: 'default',
    currentThemeType: 'light',
    isThemeChanging: false,

    // Global Alerts
    errorAlert: {
        isOpen: false
    },
    waitAlert: {
        isOpen: false
    },
    messageAlert: {
        isOpen: false
    }
}

const createPackageReducer = (): Reducer => (state: Partial<PackageGlobalState> = initialState, action: AnyAction) => {
    switch (action.type) {
        case PackageStoreType.CORE_INITIALIZE: {
            const { payload } = action.value;
            return Object.assign({}, state, payload, { hasInitialized: true });
        }
        case PackageStoreType.CORE_SET_CURRENT_USER: {
            const { isAuthenticated, userInfo, token } = action.payload;
            return Object.assign({}, state, {
                isAuthenticated,
                userInfo,
                token
            })
        }
        case PackageStoreType.CORE_SET_THEME: {
            const { currentThemeId, isThemeChanging, currentThemeType } = action.payload;
            return Object.assign({}, state, {
                currentThemeId,
                currentThemeType: currentThemeType ? currentThemeType : 'light',
                isThemeChanging: isThemeChanging ? isThemeChanging : false
            })
        }
        case PackageStoreType.CORE_SET_MSG:
        case PackageStoreType.CORE_SET_WAIT:
        case PackageStoreType.CORE_SET_ERROR: {
            const { value } = action.payload;
            const _key = {
                [PackageStoreType.CORE_SET_MSG]: 'messageAlert',
                [PackageStoreType.CORE_SET_WAIT]: 'waitAlert',
                [PackageStoreType.CORE_SET_ERROR]: 'errorAlert',
            }
            return Object.assign({}, state, {
                [_key[action.type]]: value
            })
        }
        case PackageStoreType.CORE_CLEAR_ALERT: {
            return Object.assign({}, state, {
                messageAlert: Object.assign({}, state.messageAlert, {
                    isOpen: false
                }),
                errorAlert: Object.assign({}, state.errorAlert, {
                    isOpen: false
                }),
                waitAlert: Object.assign({}, state.waitAlert, {
                    isOpen: false
                })
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

export type ThemePack = {
    id: string
    url: string
    type: 'light' | 'dark'
}

export class ArkPackage<ModuleType = any, ConfigType = BaseConfigType, ServiceProviderType = ServiceProviderBase | string> implements IArkPackage<ModuleType> {
    static instance: any;
    static getInstance<ModuleType = any, ConfigType = BaseConfigType, ServiceProviderType = ServiceProviderBase>(): ArkPackage<ModuleType, ConfigType, ServiceProviderType> {
        if (!ArkPackage.instance) {
            ArkPackage.instance = new ArkPackage<ModuleType, ConfigType, ServiceProviderType>();
            return ArkPackage.instance as ArkPackage<ModuleType, ConfigType, ServiceProviderType>;
        }

        return ArkPackage.instance as ArkPackage<ModuleType, ConfigType, ServiceProviderType>;
    }

    static getRouter(): { Route: Route, Redirect: Redirect } {
        if (!ArkPackage.instance) {
            throw new Error('ArkPackage has not been initialized');
        }
        return {
            Route: (ArkPackage.instance as ArkPackage).RouterRoute,
            Redirect: (ArkPackage.instance as ArkPackage).RouterRedirect
        }
    }

    mode: 'Browser' | 'Server' = null;
    modules: ModuleType = {} as any
    routeConfig: PackageRouteConfig[] = [];
    store: Store<Record<CORE_TOAST_PACKAGE_ID_TYPE, ToastStateType> & Record<CORE_PACKAGE_ID_TYPE, PackageGlobalState> & PackageStateType<ModuleType>> = null;
    configOpts: ConfigEnvironment<ConfigType & BaseConfigType<ServiceProviderType>> = { 'default': {} as any };
    configMode: string = 'default';
    serviceProviderModuleMap: ModuleServiceProviderMap<ModuleType> = {} as any;
    toast: ToastModule = new ToastModule(this as any);
    themes: ThemePack[] = [
        {
            id: 'default',
            type: 'light',
            url: null
        }
    ];

    private i18n: i18n;
    private i18nInitOptions: InitOptions;
    private i18nReactInitializer: ThirdPartyModule;
    private I18nextProvider: React.ComponentType<I18nextProviderProps>;
    private packageConfiguration: Partial<PackageConfiguration> = {} as any;
    private _serviceProviders: ServiceProvider<ServiceProviderType> = {} as any;
    private _serviceProviderConfigurations: ServiceProviderConfiguration<ServiceProviderType> = {} as any;
    private _reduxConnector: any = null;

    Router: React.FunctionComponent<{ location?: string }>
    RouterProvider: any = null;
    RouterSwitch: any = null;
    RouterRoute: any = null;
    RouterRedirect: any = null;

    useRouter(_provider: any, _switch: any, _route: any, _redirect: any): this {
        this.RouterProvider = _provider;
        this.RouterSwitch = _switch;
        this.RouterRoute = _route;
        this.RouterRedirect = _redirect;
        return this;
    }

    usei18next(i18n: i18n, provider: React.ComponentType<I18nextProviderProps>, initializer: ThirdPartyModule, options?: InitOptions): this {
        options = Object.assign({
            resources: {
                en: {
                    translation: {
                        "Translation Test": "Translation Test [DONE]"
                    }
                }
            },
            lng: "en",
            fallbackLng: "en",

            keySeparator: false,

            interpolation: {
                escapeValue: false
            }
        }, options || {});

        this.i18n = i18n;
        this.i18nReactInitializer = initializer;
        this.i18nInitOptions = options;
        this.I18nextProvider = provider;
        return this;
    }

    configure(opts: Partial<PackageConfiguration>) {
        this.packageConfiguration = opts;
    }

    private shouldInitializeServerContext(): boolean {
        return Object.keys(this.modules).some((key) => {
            // @ts-ignore
            return (this.modules[key] as ArkModule).initializeServerContext;
        })
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
        _module.toast = this.toast;
        _module.normalizeActionTypes();
        _module.attachContextToComponents(_module.components);
        _module.attachContextToComponents(_module.views);
        // @ts-ignore
        this.modules[id] = _module;
    }

    registerThemes(...themes: ThemePack[]) {
        this.themes.push(...themes);
    }

    setTheme(id: string) {
        if (id === 'default') {
            this.store.dispatch({
                type: PackageStoreType.CORE_SET_THEME,
                payload: {
                    currentThemeId: id,
                    currentThemeType: 'light',
                    isThemeChanging: false
                }
            })
            if (localStorage && localStorage !== undefined) {
                localStorage.removeItem('selected-theme-id');
            }
            if (this.mode === 'Browser') {
                removeThemeLink();
            }
            return;
        }

        if (!this.mode) {
            throw new Error('setTheme can only be called after initialize call');
        }

        const theme = this.themes.find(t => t.id === id);
        if (theme) {
            // Get old theme id
            const state = this.store.getState();
            const oldThemeId = state.__CORE_PACKAGE.currentThemeId;
            const oldThemeType = state.__CORE_PACKAGE.currentThemeType;

            this.store.dispatch({
                type: PackageStoreType.CORE_SET_THEME,
                payload: {
                    currentThemeId: id,
                    currentThemeType: theme.type,
                    isThemeChanging: true
                }
            })
            if (this.mode === 'Browser') {
                if (document && document !== undefined) {
                    loadTheme(theme.id, theme.url, (success, link) => {
                        if (success) {
                            setTimeout(() => {
                                removeThemeLink(oldThemeId);
                                this.store.dispatch({
                                    type: PackageStoreType.CORE_SET_THEME,
                                    payload: {
                                        currentThemeId: id,
                                        currentThemeType: theme.type,
                                        isThemeChanging: false
                                    }
                                })
                            }, 1000);
                            if (localStorage && localStorage !== undefined) {
                                localStorage.setItem('selected-theme-id', id);
                            }
                        } else {
                            this.store.dispatch({
                                type: PackageStoreType.CORE_SET_THEME,
                                payload: {
                                    currentThemeId: oldThemeId,
                                    currentThemeType: oldThemeType,
                                    isThemeChanging: false
                                }
                            })
                        }
                    }, this)
                }
            }
        } else {
            throw new Error(`Theme ID '${id}' is not registered`);
        }
    }

    showMessage(message: string, title?: string, canCloseManually?: boolean) {
        title = title ? title : 'Message';
        canCloseManually = canCloseManually ? canCloseManually : false;
        this.store.dispatch({
            type: PackageStoreType.CORE_SET_MSG,
            payload: {
                value: {
                    isOpen: true,
                    title,
                    message,
                    canCloseManually
                }
            }
        })
    }

    showWait(message: string, title?: string, canCloseManually?: boolean) {
        title = title ? title : 'Please wait...';
        canCloseManually = canCloseManually ? canCloseManually : false;
        this.store.dispatch({
            type: PackageStoreType.CORE_SET_WAIT,
            payload: {
                value: {
                    isOpen: true,
                    title,
                    message,
                    canCloseManually
                }
            }
        })
    }

    showError(message: string, title?: string, canCloseManually?: boolean) {
        title = title ? title : 'Error';
        canCloseManually = canCloseManually ? canCloseManually : false;
        this.store.dispatch({
            type: PackageStoreType.CORE_SET_ERROR,
            payload: {
                value: {
                    isOpen: true,
                    title,
                    message,
                    canCloseManually
                }
            }
        })
    }

    clearAlert() {
        this.store.dispatch({
            type: PackageStoreType.CORE_CLEAR_ALERT
        })
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
            [CORE_PACKAGE_ID]: createPackageReducer(),
            [CORE_TOAST_PACKAGE_ID]: this.toast.getReducer()
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

        // Initialze state dependent process
        this._initializeTheme();

        return this.store;
    }

    isAuthenticated(): boolean {
        const state = this.store.getState();
        if (state && state.__CORE_PACKAGE) {
            return state.__CORE_PACKAGE.isAuthenticated && state.__CORE_PACKAGE.isAuthenticated === true;
        }
    }

    private _getServiceProviderConfiguration(provider: ServiceProviderType): AxiosRequestConfig {
        // @ts-ignore
        if (this.getConfig()[provider]) {
            // @ts-ignore
            return this.getConfig()[provider] as AxiosRequestConfig;
        }

        return {
            withCredentials: true
        }
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

    getServiceProvider(provider: ServiceProviderType | string): AxiosInstance {
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

    private _initializeTheme() {
        if (this.mode === 'Browser') {
            if (localStorage && localStorage !== undefined) {
                const themeId = localStorage.getItem('selected-theme-id');
                if (themeId && themeId !== '') {
                    this.setTheme(themeId);
                }
            }
        } else {
            console.log('Theme setup skipped in server');
        }
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

    private _initializeApp(mode: 'Browser' | 'Server', done: (err: Error, options: ArkPackageOption<ModuleType, PackageStateType<ModuleType>>) => void, connect?: any) {
        if (!this.RouterProvider) {
            throw new Error('Router not initialized')
        }
        
        this.mode = mode;
        this.setupStore(true);
        // Attach redux connector
        this._reduxConnector = connect;
        let ConnectedToastProvider: any = ToastProvider;
        this._initializeModules();

        const self = this;
        this.Router = (
            class Main extends React.Component<any, any> {

                fetchContext() {
                    self.getServiceProvider('Main').get('/__context')
                    .then((response) => {
                        self.store.dispatch({
                            type: PackageStoreType.CORE_INITIALIZE,
                            value: {
                                payload: response.data
                            }
                        })
                    }, (err) => {
                        console.error(err);
                        // setTimeout(() => {
                        //     this.fetchContext();
                        // }, 100);
                    })
                }

                componentDidMount() {
                    if (self.shouldInitializeServerContext()) {
                        const reduxState = this.props.reduxState;
                        if (reduxState.hasInitialized !== true) {
                            this.fetchContext();
                        }
                    } else {
                        self.store.dispatch({
                            type: PackageStoreType.CORE_INITIALIZE,
                            value: {
                                payload: {}
                            }
                        })
                    }
                }

                render() {
                    const reduxState = this.props.reduxState;

                    let themeId: string = 'default';
                    let themeType: string = 'light';
                    if (reduxState) {
                        themeId = reduxState.currentThemeId;
                        themeType = reduxState.currentThemeType;
                    }

                    if (!reduxState.hasInitialized) {
                        return <div>Loading...</div>
                    }

                    return (
                        <self.I18nextProvider i18n={self.i18n}>
                            <self.RouterProvider location={this.props.location}>
                                <div className={`${themeId} ${themeType} h-100`}>
                                    {
                                        reduxState ? (
                                            <ConnectedToastProvider />
                                        ) : null
                                    }
                                    <self.RouterSwitch>
                                        {
                                            self.routeConfig.map((route: PackageRouteConfig, index: number) => {
                                                const _Route = route.Router || self.RouterRoute;
                                                return <_Route key={index} {...route} />
                                            })
                                        }
                                    </self.RouterSwitch>
                                    {
                                        reduxState ? (
                                            <>
                                                <AlertModal
                                                    isOpen={reduxState.messageAlert ? reduxState.messageAlert.isOpen : false}
                                                    title={reduxState.messageAlert ? reduxState.messageAlert.title : ''}
                                                    message={reduxState.messageAlert ? reduxState.messageAlert.message : ''}
                                                    canCloseManually={reduxState.messageAlert ? reduxState.messageAlert.canCloseManually : false}
                                                    toggle={() => self.clearAlert()}
                                                    mode='message'
                                                />
                                                <AlertModal
                                                    isOpen={reduxState.waitAlert ? reduxState.waitAlert.isOpen : false}
                                                    title={reduxState.waitAlert ? reduxState.waitAlert.title : ''}
                                                    message={reduxState.waitAlert ? reduxState.waitAlert.message : ''}
                                                    canCloseManually={reduxState.waitAlert ? reduxState.waitAlert.canCloseManually : false}
                                                    toggle={() => self.clearAlert()}
                                                    mode='wait'
                                                />
                                                <AlertModal
                                                    isOpen={reduxState.errorAlert ? reduxState.errorAlert.isOpen : false}
                                                    title={reduxState.errorAlert ? reduxState.errorAlert.title : ''}
                                                    message={reduxState.errorAlert ? reduxState.errorAlert.message : ''}
                                                    canCloseManually={reduxState.errorAlert ? reduxState.errorAlert.canCloseManually : false}
                                                    toggle={() => self.clearAlert()}
                                                    mode='error'
                                                />
                                            </>
                                        ) : null
                                    }
                                </div>
                            </self.RouterProvider>
                        </self.I18nextProvider>
                    )
                }
            }
        ) as any;

        // Connect component if redux connector is available
        if (this._reduxConnector) {
            this.Router = this._reduxConnector((state: any) => ({ reduxState: state.__CORE_PACKAGE }))(this.Router);
            ConnectedToastProvider = this._reduxConnector((state: any) => ({ context: state.__CORE_TOAST_PACKAGE }))(ConnectedToastProvider);
        }

        done(null, this as any);
    }

    initialize(mode: 'Browser' | 'Server', done: (err: Error, options: ArkPackageOption<ModuleType, PackageStateType<ModuleType>>) => void, connect?: any) {
        if (!this.i18n) throw new Error('Looks like you missed out to connect i18next');
        this.i18n
        .use(this.i18nReactInitializer)
        .init(this.i18nInitOptions, (err, t) => {
            if (err) {
                throw err;
            }
            this._initializeApp(mode, done, connect);
        })
    }
}

function ConditionalRoute(outterProps: RouteProps & ConditionalRouteProps) {
    const RouteProxy = ArkPackage.getRouter();
    const _Route: any = RouteProxy.Route;
    const _Redirect: any = RouteProxy.Redirect;
    return <_Route {...(outterProps as any)} children={(childProps: any) => {
        let redirectUrl = outterProps.onFailureRedirectPath;

        if (outterProps.predicate) {
            const predicateValue = outterProps.predicate();
            if (typeof predicateValue === 'boolean' && predicateValue === true) {
                return <outterProps.component {...childProps} />
            } else if (typeof predicateValue === 'string') {
                redirectUrl = predicateValue;
            }
        }

        if (outterProps.attachReturnUrl === true) {
            let searchParams = queryString.parseUrl(outterProps.location.pathname);
            searchParams.query.redirect = encodeURI(outterProps.location.pathname);
            redirectUrl = queryString.stringifyUrl({
                query: searchParams.query,
                url: redirectUrl
            })
        }

        return <_Redirect to={{
            pathname: redirectUrl,
            state: { from: outterProps.location }
        }} />
    }} />
}

export function withCondition(options: ConditionalRouteProps) {
    return (props: RouteProps) => <ConditionalRoute {...options} {...props} />
}

export function withAuthentication(onFailureRedirectPath: string, shouldHaveAuthenticated?: boolean) {
    shouldHaveAuthenticated = shouldHaveAuthenticated !== undefined && shouldHaveAuthenticated !== null ? shouldHaveAuthenticated : true;
    return withCondition({
        onFailureRedirectPath,
        predicate: () => {
            const instance = ArkPackage.getInstance();
            if (!instance.store) {
                throw new Error('Package must have initialized before calling withAuthentication');
            }

            const state = instance.store.getState();
            if (state.__CORE_PACKAGE) {
                return instance.store.getState().__CORE_PACKAGE.isAuthenticated === shouldHaveAuthenticated;
            }

            return false;
        }
    })
}