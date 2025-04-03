import { ILabShell } from '@jupyterlab/application';
import { Launcher, LauncherModel } from './launcher';
import { IMainMenu } from '@jupyterlab/mainmenu';
import { ILauncher } from '@jupyterlab/launcher';
import { ITranslator } from '@jupyterlab/translation';
import { ICommandPalette, MainAreaWidget } from '@jupyterlab/apputils';
import { toArray } from '@lumino/algorithm';
import { Widget } from '@lumino/widgets';
import { asteriskIcon } from './icons';
import { homeIcon } from '@jupyterlab/ui-components';
export { showBrowseFileDialog } from './BrowseFileDialog';
import '../style/index.css';
/**
 * The main application icon.
 */
const logo = {
    id: '@amphi/ui-component:logo',
    optional: [ILabShell],
    autoStart: true,
    activate: (app, labShell) => {
        let logo = null;
        if (labShell) {
            logo = new Widget();
            asteriskIcon.element({
                container: logo.node,
                elementPosition: 'center',
                margin: '2px 2px 2px 16px',
                height: '16px',
                width: '16px'
            });
        }
        if (logo) {
            logo.id = 'jp-MainLogo';
            app.shell.add(logo, 'top', { rank: 0 });
        }
    }
};
/**
 * The command IDs used by the launcher plugin.
 */
const CommandIDs = {
    create: 'launcher:create'
};
/**
 * The main launcher.
 */
const launcher = {
    id: '@amphi/ui-component:launcher',
    autoStart: true,
    requires: [ITranslator, ILabShell, IMainMenu],
    optional: [ICommandPalette],
    provides: ILauncher,
    activate: (app, translator, labShell, mainMenu, manager, palette) => {
        console.log('Amphi - custom Launcher is activated!');
        /** */
        // Use custom Amphi launcher
        const { commands, shell } = app;
        const trans = translator.load('jupyterlab');
        const model = new LauncherModel();
        console.log('Amphi - theme before adding launcher:create');
        commands.addCommand(CommandIDs.create, {
            label: trans.__('New'),
            execute: (args) => {
                const cwd = args['cwd'] ? String(args['cwd']) : '';
                const id = `launcher-${Private.id++}`;
                const callback = (item) => {
                    labShell.add(item, 'main', { ref: id });
                };
                const launcher = new Launcher({
                    model,
                    cwd,
                    callback,
                    commands,
                    translator
                }, commands);
                launcher.model = model;
                launcher.title.icon = homeIcon;
                launcher.title.label = trans.__('Homepage');
                const main = new MainAreaWidget({ content: launcher });
                // If there are any other widgets open, remove the launcher close icon.
                main.title.closable = !!toArray(labShell.widgets('main')).length;
                main.id = id;
                shell.add(main, 'main', {
                    activate: args['activate'],
                    ref: args['ref']
                });
                labShell.layoutModified.connect(() => {
                    // If there is only a launcher open, remove the close icon.
                    main.title.closable = toArray(labShell.widgets('main')).length > 1;
                }, main);
                return main;
            }
        });
        if (palette) {
            palette.addItem({
                command: CommandIDs.create,
                category: trans.__('Homepage')
            });
        }
        /**
         * This function seems to set up and handle the behavior of an "add" button within a JupyterLab-like environment.
         * When the button is clicked (or an "add" action is requested), the function determines
         * which tab or panel the action was requested from and then executes a command to handle the request,
         * either by creating a main launcher or by performing another default "create" action.
         */
        if (labShell) {
            labShell.addButtonEnabled = true;
            labShell.addRequested.connect((sender, arg) => {
                var _a;
                // Get the ref for the current tab of the tabbar which the add button was clicked
                const ref = ((_a = arg.currentTitle) === null || _a === void 0 ? void 0 : _a.owner.id) ||
                    arg.titles[arg.titles.length - 1].owner.id;
                if (commands.hasCommand('filebrowser:create-main-launcher')) {
                    // If a file browser is defined connect the launcher to it
                    return commands.execute('filebrowser:create-main-launcher', {
                        ref
                    });
                }
                return commands.execute(CommandIDs.create, { ref });
            });
        }
        return model;
    }
};
/**
 * The namespace for module private data.
 */
var Private;
(function (Private) {
    /**
     * The incrementing id used for launcher widgets.
     */
    // eslint-disable-next-line
    Private.id = 0;
})(Private || (Private = {}));
const plugins = [logo, launcher];
export default plugins;
export * from './icons';
