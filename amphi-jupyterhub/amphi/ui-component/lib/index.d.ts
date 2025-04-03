import { JupyterFrontEndPlugin } from '@jupyterlab/application';
export { showBrowseFileDialog } from './BrowseFileDialog';
import '../style/index.css';
declare const plugins: JupyterFrontEndPlugin<any>[];
export default plugins;
export * from './icons';
