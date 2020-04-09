import React, { CSSProperties } from 'react';
import { Toast, ToastBody, ToastHeader, Spinner } from 'reactstrap';
import { ArkPackage } from "./package";
import { Reducer } from "redux";
import { DispatchProp } from 'react-redux';

export type CORE_TOAST_PACKAGE_ID_TYPE = '__CORE_TOAST_PACKAGE';
export const CORE_TOAST_PACKAGE_ID: CORE_TOAST_PACKAGE_ID_TYPE = '__CORE_TOAST_PACKAGE';

export const ToastActionType = {
    TOAST_GENERATE_ID: `${CORE_TOAST_PACKAGE_ID}_GENERATE_ID`,
    TOAST_ADD: `${CORE_TOAST_PACKAGE_ID}_TOAST_ADD`,
    TOAST_UPDATE: `${CORE_TOAST_PACKAGE_ID}_TOAST_UPDATE`,
    TOAST_DISMISS: `${CORE_TOAST_PACKAGE_ID}_TOAST_DISMISS`,
    TOAST_CLEAR: `${CORE_TOAST_PACKAGE_ID}_TOAST_CLEAR`
}

export type ToastOption = {
    message: string
    title?: string
    manualDismiss?: boolean
    autoDismiss?: 'off' | number
    headerIcon?: 'none' | 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'light' | 'dark' | 'spinner'
    isOpen?: boolean
    id?: number
}

export type ToastStateType = {
    nextToastId: number
    toasts: ToastOption[]
}

export class ToastModule {
    private _package: ArkPackage = null;
    constructor(_package: ArkPackage) {
        this._package = _package;
    }

    initialState: ToastStateType = {
        nextToastId: 10100,
        toasts: []
    }

    show(options: ToastOption): Readonly<ToastOption> {
        options = this.normalizeToast(options);
        this._package.store.dispatch({
            type: ToastActionType.TOAST_ADD,
            payload: {
                value: options
            }
        })

        return options;
    }

    update(id: number, option: Partial<ToastOption>) {
        this._package.store.dispatch({
            type: ToastActionType.TOAST_UPDATE,
            payload: {
                id,
                value: option
            }
        })
    }

    dismiss(id: number) {
        this._package.store.dispatch({
            type: ToastActionType.TOAST_UPDATE,
            payload: {
                id,
                value: {
                    isOpen: false
                }
            }
        })
    }

    clear() {
        this._package.store.dispatch({
            type: ToastActionType.TOAST_CLEAR
        })
    }

    getReducer(): Reducer {
        return (state: ToastStateType = this.initialState, action) => {
            switch (action.type) {
                case ToastActionType.TOAST_GENERATE_ID: {
                    return Object.assign({}, state, {
                        nextToastId: state.nextToastId + 1
                    })
                }
                case ToastActionType.TOAST_ADD: {
                    const value: ToastOption = action.payload.value;
                    
                    return Object.assign({}, state, {
                        toasts: [Object.assign(value, { id: state.nextToastId }), ...state.toasts]
                    })
                }
                case ToastActionType.TOAST_DISMISS: {
                    const { id } = action.payload;
                    return Object.assign({}, state, {
                        toasts: state.toasts.map((t) => {
                            if (t.id === id) {
                                return Object.assign({}, t, {
                                    isOpen: false
                                })
                            }
                            return t;
                        })
                    })
                }
                case ToastActionType.TOAST_UPDATE: {
                    const { id, value } = action.payload;
                    return Object.assign({}, state, {
                        toasts: state.toasts.map((t) => {
                            if (t.id === id) {
                                return Object.assign({}, t, value)
                            }
                            return t;
                        })
                    })
                }
                case ToastActionType.TOAST_CLEAR: {
                    return Object.assign({}, this.initialState);
                }
                default: {
                    return state;
                }
            }
        }
    }

    private generateToastId(): number {
        const state = this._package.store.getState();
        if (state && state.__CORE_TOAST_PACKAGE) {
            const id = state.__CORE_TOAST_PACKAGE.nextToastId;
            this._package.store.dispatch({
                type: ToastActionType.TOAST_GENERATE_ID
            })
            return id;
        }

        return null;
    }

    private normalizeToast(option: ToastOption): ToastOption {
        const id = this.generateToastId();
        if (!id) throw new Error('Failed to generate toast id');
        return Object.assign<Partial<ToastOption>, ToastOption>({
            autoDismiss: 3000,
            headerIcon: 'none',
            isOpen: true,
            manualDismiss: true,
            title: 'Notification',
            id: id
        }, option);
    }
}

type ToastCalloutPropType = {
    onDismiss: (id: number) => void
}

export class ToastCallout extends React.Component<ToastOption & ToastCalloutPropType> {

    timer: any = null;

    componentDidMount() {
        if (typeof this.props.autoDismiss === 'number') {
            this.timer = setTimeout(() => {
                this.props.onDismiss && this.props.onDismiss(this.props.id)
            }, this.props.autoDismiss);
        }
    }

    componentWillUnmount() {
        if (this.timer) {
            clearTimeout(this.timer);
        }
    }

    render() {
        return (
            <div className="p-3 my-2 rounded">
                <Toast isOpen={this.props.isOpen}>
                    <ToastHeader icon={(() => {
                        switch (this.props.headerIcon) {
                            case 'none': {
                                return undefined;
                            }
                            case 'spinner': {
                                return <Spinner size="sm" />;
                            }
                            default: {
                                return this.props.headerIcon;
                            }
                        }
                    })()} toggle={this.props.manualDismiss ? () => this.props.onDismiss && this.props.onDismiss(this.props.id) : null}>
                        {this.props.title}
                    </ToastHeader>
                    <ToastBody style={{ minWidth: 275 }}>
                        {this.props.message}
                    </ToastBody>
                </Toast>
            </div>
        )
    }
}

export function ToastProvider(props: { context: ToastStateType } & DispatchProp) {
    const wrapperStyle: CSSProperties = {
        position: 'absolute',
        right: 30,
        top: 30
    }

    const dismissCallout = (id: number) => {
        props.dispatch({
            type: ToastActionType.TOAST_DISMISS,
            payload: {
                id
            }
        })
    }

    return (
        <div style={wrapperStyle}>
            {
                props.context.toasts.filter(t => t.isOpen === true).map((toast) => <ToastCallout key={toast.id} {...toast} onDismiss={dismissCallout} />)
            }
        </div>
    )
}