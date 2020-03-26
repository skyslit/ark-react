import React from 'react';
import { Reducer, Store, Action } from 'redux';
import { ArkPackage } from "./package";

export type ComponentMap = {
    [key: string]: React.FunctionComponent | React.ComponentClass
}

export type ActionTypes = {
    [k: string]: string
}

export interface IArkModule<StateType = any, ServiceType = any> {
    type: string
    id: string

    package: ArkPackage
    views: ComponentMap
    components: ComponentMap
    services: ServiceType
    state: StateType
    actionTypes: ActionTypes
    
    getReducer: () => Reducer
    getState: () => StateType
}


export type ArkPackageOption<ModuleType = any, PackageStateType = any> = Readonly<IArkPackage<ModuleType, PackageStateType>>

export type PackageRouteConfig = {
    path: string
    component: React.FunctionComponent | React.ComponentClass
}

export interface IArkPackage<ModuleType = any, PackageStateType = any> {
    modules: ModuleType
    routeConfig: PackageRouteConfig[]
    store: Store<PackageStateType>

    Router: React.FunctionComponent

    setupStore: (enableReduxDevTool?: boolean) => Store<PackageStateType>
    initialize: (done: (err: Error, options: ArkPackageOption<ModuleType, PackageStateType>) => void) => void
}