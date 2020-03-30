import React from 'react';
import { IArkModule, ComponentMap, ActionTypes } from "./types"
import { ArkPackage } from "./package"
import { Reducer } from "redux";

export class ArkModule<StateType = any> implements IArkModule<StateType> {
    type: string = null;
    id: string = null;

    package: ArkPackage = null;
    views: ComponentMap = {};
    components: ComponentMap = {};
    controller: any;
    state: StateType = {} as any;
    actionTypes: ActionTypes = {} as any;

    private connect: any;

    constructor (type: string, opts?: Partial<ArkModule>) {
        this.type = type;
        if (opts) {
            Object.keys(opts).forEach(k => (this as any)[k] = (opts as any)[k]);
        }
    }

    useConnect(_connect: any): void {
        this.connect = _connect;
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

    attachRedux(connect: any) {
        return (component: React.ComponentType<any>) => {
            return connect((state: any) => ({
                context: (state as any)[this.id]
            }))(component);
        }
    }

    attachContextToComponent(masterProps: { module: ArkModule }) {
        if (!this.connect) {
            throw new Error(`You probably missed out useConnect in module '${this.id}'`)
        }
        return (Component: React.ComponentType<any>) => {
            return this.connect((state: any) => ({
                context: (state as any)[this.id]
            }))((props: any) => <Component {...props} {...masterProps} />)
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