import { IArkModule, ComponentMap } from "./types"
import { ArkPackage } from "./package"
import { Action, Reducer } from "redux";

export class ArkModule<StateType = any, ActionType extends Action = any, ServiceType = any> implements IArkModule<StateType, ActionType, ServiceType> {
    type: string = null;
    id: string = null;

    package: ArkPackage = null;
    views: ComponentMap = {};
    components: ComponentMap = {};
    actions: ActionType;
    services: ServiceType;
    state: StateType = {} as any;

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
        return null;
    }
}