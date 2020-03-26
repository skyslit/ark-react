import { IArkModule, ComponentMap } from "./types"
import { ArkPackage } from "./package"
import { Action, Store, Reducer } from "redux";

export class ArkModule<StateType = any, ActionType extends Action = any, ServiceType = any> implements IArkModule<StateType, ActionType, ServiceType> {
    type: string = null;
    id: string = null;

    package: ArkPackage = null;
    views: ComponentMap = {};
    components: ComponentMap = {};
    actions: ActionType;
    services: ServiceType;

    constructor (type: string, opts?: Partial<ArkModule>) {
        this.type = type;

        if (opts) {
            Object.keys(opts).forEach(k => (this as any)[k] = (opts as any)[k]);
        }
    }
    
    getReducer(): Reducer {
        return null;
    }

    getStore(): Store<StateType, ActionType> {
        return null;
    }
}