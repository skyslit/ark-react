import React from 'react';
import { RouteProps, Switch, Route, BrowserRouter as Router } from 'react-router-dom';
import { ArkModule } from './module';

export class ArkPackage<ModuleType> {

    // Member properties
    modules: ModuleType
    rootElement: JSX.Element
    routes: RouteProps[]

    constructor() {
        this.modules = {} as any;
        this.rootElement = null;
        this.routes = [];
    }

    registerModule(_module: ArkModule) {
        // Register views
        // @ts-ignore
        this.modules[_module.name] = _module;
    }

    initialize(cb: (err: Error, root: JSX.Element) => void) {
        // Do awesome work
        this.rootElement = (
            <React.Fragment>
                <Router>
                    <Switch>
                        {
                            this.routes.map((route, index) => {
                                return <Route key={index} {...route} />
                            })
                        }
                    </Switch>
                </Router>
            </React.Fragment>
        )

        cb(null, this.rootElement);
    }
}
