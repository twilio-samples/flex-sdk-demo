import { Theme } from "@twilio-paste/theme";
import { BrowserRouter, Switch, Route } from "react-router-dom";
import Login from "./Login";
import { AppWrapper } from "./AppWrapper";

function Navigation() {
    return (
        <Theme.Provider theme="default">
            <BrowserRouter>
                <Switch>
                    <Route path="/" exact component={Login} />
                    <Route path="/agentDesktop" component={AppWrapper} />
                </Switch>
            </BrowserRouter>
        </Theme.Provider>
    );
}

export default Navigation;
