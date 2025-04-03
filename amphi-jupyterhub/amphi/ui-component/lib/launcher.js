import { Launcher as JupyterlabLauncher, LauncherModel as JupyterLauncherModel } from '@jupyterlab/launcher';
import { githubIcon, pipelineIcon, discourseIcon, alertDiamondIcon } from './icons';
import { each } from '@lumino/algorithm';
import React, { useEffect, useState } from 'react';
// Largely inspired by Elyra launcher https://github.com/elyra-ai/elyra
/**
 * The known categories of launcher items and their default ordering.
 */
const AMPHI_CATEGORY = 'Data Integration';
const CommandIDs = {
    newPipeline: 'pipeline-editor:create-new',
    newFile: 'fileeditor:create-new',
    createNewPythonEditor: 'script-editor:create-new-python-editor',
    createNewREditor: 'script-editor:create-new-r-editor'
};
// LauncherModel deals with the underlying data and logic of the launcher (what items are available, their order, etc.).
export class LauncherModel extends JupyterLauncherModel {
    /**
     * Return an iterator of launcher items, but remove unnecessary items.
     */
    items() {
        const items = [];
        let pyEditorInstalled = false;
        let rEditorInstalled = false;
        this.itemsList.forEach(item => {
            if (item.command === CommandIDs.createNewPythonEditor) {
                pyEditorInstalled = true;
            }
            else if (item.command === CommandIDs.createNewREditor) {
                rEditorInstalled = true;
            }
        });
        if (!pyEditorInstalled && !rEditorInstalled) {
            return this.itemsList[Symbol.iterator]();
        }
        // Dont add tiles for new py and r files if their script editor is installed
        this.itemsList.forEach(item => {
            var _a, _b;
            if (!(item.command === CommandIDs.newFile &&
                ((pyEditorInstalled && ((_a = item.args) === null || _a === void 0 ? void 0 : _a.fileExt) === 'py') ||
                    (rEditorInstalled && ((_b = item.args) === null || _b === void 0 ? void 0 : _b.fileExt) === 'r')))) {
                items.push(item);
            }
        });
        return items[Symbol.iterator]();
    }
}
// Launcher deals with the visual representation and user interactions of the launcher
// (how items are displayed, icons, categories, etc.).
export class Launcher extends JupyterlabLauncher {
    /**
     * Construct a new launcher widget.
     */
    constructor(options, commands) {
        super(options);
        this.myCommands = commands;
        // this._translator = this.translator.load('jupyterlab');
    }
    /**
    The replaceCategoryIcon function takes a category element and a new icon.
    It then goes through the children of the category to find the section header.
    Within the section header, it identifies the icon (by checking if it's not the section title)
    and replaces it with the new icon. The function then returns a cloned version of the original
    category with the icon replaced.
     */
    replaceCategoryIcon(category, icon) {
        const children = React.Children.map(category.props.children, child => {
            if (child.props.className === 'jp-Launcher-sectionHeader') {
                const grandchildren = React.Children.map(child.props.children, grandchild => {
                    if (grandchild.props.className !== 'jp-Launcher-sectionTitle') {
                        return React.createElement(icon.react, { stylesheet: "launcherSection" });
                    }
                    else {
                        return grandchild;
                    }
                });
                return React.cloneElement(child, child.props, grandchildren);
            }
            else {
                return child;
            }
        });
        return React.cloneElement(category, category.props, children);
    }
    /**
     * Render the launcher to virtual DOM nodes.
     */
    render() {
        if (!this.model) {
            return null;
        }
        const launcherBody = super.render();
        const launcherContent = launcherBody === null || launcherBody === void 0 ? void 0 : launcherBody.props.children;
        const launcherCategories = launcherContent.props.children;
        const categories = [];
        const knownCategories = [
            AMPHI_CATEGORY,
            // this._translator.__('Console'),
            // this._translator.__('Other'),
            // this._translator.__('Notebook')
        ];
        each(knownCategories, (category, index) => {
            React.Children.forEach(launcherCategories, (cat) => {
                if (cat.key === category) {
                    if (cat.key === AMPHI_CATEGORY) {
                        cat = this.replaceCategoryIcon(cat, pipelineIcon);
                    }
                    categories.push(cat);
                }
            });
        });
        const handleNewPipelineClick = () => {
            this.myCommands.execute('pipeline-editor:create-new');
        };
        const handleUploadFiles = () => {
            this.myCommands.execute('ui-components:file-upload');
        };
        const AlertBox = () => {
            const [isVisible, setIsVisible] = useState(false);
            useEffect(() => {
                const alertClosed = localStorage.getItem('alertClosed') === 'true';
                setIsVisible(!alertClosed);
            }, []);
            const closeAlert = () => {
                setIsVisible(false);
                localStorage.setItem('alertClosed', 'true');
            };
            if (!isVisible)
                return null;
            return (React.createElement("div", { className: "alert-box" },
                React.createElement("div", { className: "alert-content" },
                    React.createElement("span", { className: "alert-icon" },
                        React.createElement(alertDiamondIcon.react, null)),
                    React.createElement("div", { className: "alert-text" },
                        React.createElement("h2", null, "About"),
                        React.createElement("p", null,
                            "Welcome to Amphi's demo playground! Explore Amphi ETL's capabilities and user experience here. ",
                            React.createElement("br", null),
                            "Note that ",
                            React.createElement("b", null, "executing pipelines is not supported in this environment."),
                            " For full functionality, install Amphi \u2014 it's free and open source.",
                            ' ',
                            React.createElement("a", { href: "https://github.com/amphi-ai/amphi-etl", target: "_blank" }, "Learn more."))),
                    React.createElement("button", { onClick: closeAlert, className: "alert-close-btn" },
                        React.createElement("span", { className: "sr-only" }, "Dismiss popup"),
                        React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", fill: "none", viewBox: "0 0 24 24", strokeWidth: "1.5", stroke: "currentColor" },
                            React.createElement("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M6 18L18 6M6 6l12 12" }))))));
        };
        return (React.createElement("div", { className: "launcher-body" },
            React.createElement("div", { className: "launcher-content" },
                React.createElement("h1", { className: "launcher-title" }, "Amphi"),
                React.createElement("div", { className: "launcher-grid" },
                    React.createElement("div", { className: "launcher-card" },
                        React.createElement("div", { className: "launcher-card-header" },
                            React.createElement("h3", null, "Start")),
                        React.createElement("ul", { className: "launcher-card-list" },
                            React.createElement("li", null,
                                React.createElement("a", { href: "#", onClick: handleNewPipelineClick, className: "launcher-card-item" },
                                    React.createElement("div", { className: "launcher-icon" },
                                        React.createElement(pipelineIcon.react, { fill: "#5A8F7B" })),
                                    React.createElement("div", null,
                                        React.createElement("strong", null, "New pipeline"),
                                        React.createElement("p", null, "Open a new untitled pipeline and drag and drop components to design and develop your data flow.")))))),
                    React.createElement("div", { className: "launcher-card" },
                        React.createElement("div", { className: "launcher-card-header" },
                            React.createElement("h3", null, "Resources")),
                        React.createElement("ul", { className: "launcher-card-list" },
                            React.createElement("li", null,
                                React.createElement("a", { href: "https://community.amphi.ai/", target: "_blank", className: "launcher-card-item" },
                                    React.createElement("div", { className: "launcher-icon" },
                                        React.createElement(discourseIcon.react, null)),
                                    React.createElement("div", null,
                                        React.createElement("strong", null, "Join the Community"),
                                        React.createElement("p", null, "Access Amphi's forum, read documentation, get support, ask questions, and share your experience.")))),
                            React.createElement("li", null,
                                React.createElement("a", { href: "https://github.com/amphi-ai/amphi-etl", target: "_blank", className: "launcher-card-item" },
                                    React.createElement("div", { className: "launcher-icon" },
                                        React.createElement(githubIcon.react, null)),
                                    React.createElement("div", null,
                                        React.createElement("strong", null, "Issues and feature requests"),
                                        React.createElement("p", null, "Report issues and suggest features on GitHub. Don't hesitate to star the repository to watch the repository."))))))))));
    }
}
