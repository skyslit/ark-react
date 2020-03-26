import { IArkModule, ComponentMap, ActionTypes } from "./types"
import { ArkPackage } from "./package"
import { Action, Reducer } from "redux";
import { Connect } from "react-redux";

export class ArkModule<StateType = any, ServiceType = any> implements IArkModule<StateType, ServiceType> {
    type: string = null;
    id: string = null;

    package: ArkPackage = null;
    views: ComponentMap = {};
    components: ComponentMap = {};
    services: ServiceType;
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

    normalizeActionTypes() {
        Object.keys(this.actionTypes).forEach(key => {
            (this.actionTypes as any)[key] = `${this.id}-${(this.actionTypes as any)[key]}`
        })
    }
}