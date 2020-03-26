import React from 'react';
import { Reducer, Store, Action } from 'redux';
import { ArkPackage } from "./package";

export type ComponentMap = {
    [key: string]: React.FunctionComponent | React.ComponentClass
}

export interface IArkModule<StateType = any, ActionType extends Action = any, ServiceType = any> {
    type: string
    id: string

    package: ArkPackage
    views: ComponentMap
    components: ComponentMap
    actions: ActionType
    services: ServiceType
    state: StateType

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