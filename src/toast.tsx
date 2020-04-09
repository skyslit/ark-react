import { ArkPackage } from "./package";
import { Reducer } from "redux";

export class Toast {
    private _package: ArkPackage = null;
    constructor(_package: ArkPackage) {
        this._package = _package;
    }

    getReducer(): Reducer {
        return (state = {}, action) => {
            switch (action.type) {
                
            }
        }
    }
}