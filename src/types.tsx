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

    getReducer: () => Reducer
    getStore: () => Store<StateType, ActionType>
}