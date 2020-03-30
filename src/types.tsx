import React from 'react';
import { Reducer, Store } from 'redux';
import { RouteComponentProps } from 'react-router-dom';
import { ArkPackage } from "./package";

export type ComponentMap = {
    [key: string]: React.ComponentType<any>
}

export type ActionTypes = {
    [k: string]: string
}

export interface IArkModule<StateType = any> {
    type: string
    id: string

    package: ArkPackage
    views: ComponentMap
    components: ComponentMap
    controller: any
    state: StateType
    actionTypes: ActionTypes
    
    getReducer: () => Reducer
    getState: () => StateType
}


export type ArkPackageOption<ModuleType = any, PackageStateType = any> = Readonly<IArkPackage<ModuleType, PackageStateType>>

export type PackageRouteConfig = {
    path: string
    component: React.ComponentType<any>
}

export interface IArkPackage<ModuleType = any, PackageStateType = any> {
    modules: ModuleType
    routeConfig: PackageRouteConfig[]
    store: Store<PackageStateType>

    Router: React.FunctionComponent

    setupStore: (enableReduxDevTool?: boolean) => Store<PackageStateType>
    initialize: (mode: 'Browser' | 'Server', done: (err: Error, options: ArkPackageOption<ModuleType, PackageStateType>) => void) => void
}

export type ComponentPropType<ModuleType extends IArkModule> = {
    module: ModuleType
    context: {
        [k in keyof ModuleType["state"]]: ModuleType["state"][k]
    }
}

export type ViewComponentPropType<ModuleType extends IArkModule> = RouteComponentProps & ComponentPropType<ModuleType>