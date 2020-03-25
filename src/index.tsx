export { ArkModule } from './module';
export { ArkPackage } from './package';

import { ArkPackage } from './package';

class SingletonMemory {
    static instance: any;

    static createInstance<ModuleType>(): ArkPackage<ModuleType> {
        return SingletonMemory.getInstance();
    }

    static getInstance<ModuleType>(): ArkPackage<ModuleType> {
        if (!SingletonMemory.instance) {
            SingletonMemory.instance = new ArkPackage<ModuleType>();
            return SingletonMemory.instance as ArkPackage<ModuleType>;
        }

        return SingletonMemory.instance as ArkPackage<ModuleType>;
    }
}

export function createPackage<ModuleType>(): ArkPackage<ModuleType> {
    return SingletonMemory.createInstance<ModuleType>();
}

export function usePackage<ModuleType>(): ArkPackage<ModuleType> {
    return SingletonMemory.getInstance<ModuleType>();
}