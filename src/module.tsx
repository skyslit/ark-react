import React from 'react';
import { IArkModule, ComponentMap, ActionTypes } from "./types"
import { ArkPackage } from "./package"
import { Action, Reducer } from "redux";
import { Connect } from "react-redux";

export class ArkModule<StateType = any, ControllerType = any> implements IArkModule<StateType, ControllerType> {
    type: string = null;
    id: string = null;

    package: ArkPackage = null;
    views: ComponentMap = {};
    components: ComponentMap = {};
    controller: ControllerType;
    state: StateType = {} as any;
    actionTypes: ActionTypes = {} as any;

    constructor (type: string, opts?: Partial<ArkModule>) {
        this.type = type;

        if (opts) {
            Object.keys(opts).forEach(k => (this as any)[k] = (opts as any)[k]);
        }
    }
    
    getReducer(): Reducer<StateType> {
        return null;
    }

    getState(): StateType {
        if (!this.package) {
            throw new Error('Package not found');
        }
        if (!this.package.store) {
            throw new Error('Store has not setup yet');
        }
        return this.package.store.getState()[this.id];
    }

    attachRedux(connect: Connect, mapStateToProps: (state: StateType) => Object) {
        return (component: React.ComponentClass | React.FunctionComponent) => {
            return connect((state) => mapStateToProps((state as any)[this.id]))(component);
        }
    }

    attachContextToComponent(masterProps: { module: ArkModule }) {
        return (Component: React.ComponentClass | React.FunctionComponent) => {
            return (props: any) => <Component {...props} {...masterProps} />
        }
    }

    normalizeActionTypes() {
        Object.keys(this.actionTypes).forEach(key => {
            (this.actionTypes as any)[key] = `${this.id}-${(this.actionTypes as any)[key]}`
        })
    }

    attachContextToComponents(componentMap: ComponentMap) {
        Object.keys(componentMap).forEach(key => {
            (componentMap as any)[key] = this.attachContextToComponent({ module: this })(componentMap[key]);
        })
    }
}