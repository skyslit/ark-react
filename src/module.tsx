
type PatialArkModule = {
    [T in keyof ArkModule]?: string
}

export class ArkModule<ViewMapType = any, ComponentMapType = any, ControllerType = any, ServiceType = any> {
    type: string

    views: ViewMapType
    components: ComponentMapType
    controller: ControllerType
    services: ServiceType

    constructor (type: string, opts?: PatialArkModule) {
        this.type = type;

        this.views = {} as any;
        this.components = {} as any;
        this.controller = {} as any;
        this.services = {} as any;

        if (opts) {
            Object.keys(opts).forEach(k => (this as any)[k] = (opts as any)[k]);
        }
    }

    registerViews(k: string, v: any) {
        if (!this.views) throw new Error('View is undefined');
        (this.views as any)[k] = v;
    }

    registerComponents(k: string, v: any) {
        if (!this.components) throw new Error('View is undefined');
        (this.components as any)[k] = v;
    }

    attachController(controller: ControllerType) {
        this.controller = controller;
    }

    attachServices(services: ServiceType) {
        this.services = services;
    }

    getReducer(): any {
        return null;
    }
}