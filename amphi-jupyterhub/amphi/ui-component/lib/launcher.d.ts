import { ILauncher, Launcher as JupyterlabLauncher, LauncherModel as JupyterLauncherModel } from '@jupyterlab/launcher';
import React from 'react';
export declare class LauncherModel extends JupyterLauncherModel {
    /**
     * Return an iterator of launcher items, but remove unnecessary items.
     */
    items(): IterableIterator<ILauncher.IItemOptions>;
}
export declare class Launcher extends JupyterlabLauncher {
    private myCommands;
    /**
     * Construct a new launcher widget.
     */
    constructor(options: ILauncher.IOptions, commands: any);
    /**
    The replaceCategoryIcon function takes a category element and a new icon.
    It then goes through the children of the category to find the section header.
    Within the section header, it identifies the icon (by checking if it's not the section title)
    and replaces it with the new icon. The function then returns a cloned version of the original
    category with the icon replaced.
     */
    private replaceCategoryIcon;
    /**
     * Render the launcher to virtual DOM nodes.
     */
    protected render(): React.ReactElement<any> | null;
}
