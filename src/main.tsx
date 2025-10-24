import * as ReactDOM from "react-dom";
import { Theme, ThemeVariants } from "@twilio-paste/theme";
import Navigation from "./Navigation.tsx";
import "./App.css";

ReactDOM.render(
    <Theme.Provider theme={ThemeVariants.FLEX}>
        <Navigation />
    </Theme.Provider>,
    document.getElementById("root")
);
