import path from "path";
import { fileURLToPath } from "url";
import HtmlWebpackPlugin from "html-webpack-plugin";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default {
    mode: "production",
    entry: "./src/main.tsx",
    output: {
        path: path.resolve(__dirname, "dist-webpack-no-treeshake"),
        filename: "bundle.js",
        clean: true
    },
    resolve: {
        extensions: [".ts", ".tsx", ".js", ".jsx"]
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: {
                    loader: "ts-loader",
                    options: {
                        configFile: "tsconfig.webpack.json",
                        transpileOnly: true
                    }
                },
                exclude: /node_modules/
            }
        ]
    },
    optimization: {
        usedExports: false,
        sideEffects: false
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: "./index.html"
        })
    ]
};
