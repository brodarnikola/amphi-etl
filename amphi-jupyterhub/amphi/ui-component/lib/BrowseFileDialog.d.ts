import { Dialog } from '@jupyterlab/apputils';
import { IDocumentManager } from '@jupyterlab/docmanager';
export interface IBrowseFileDialogOptions {
    filter?: (model: any) => boolean;
    multiselect?: boolean;
    includeDir?: boolean;
    acceptFileOnDblClick?: boolean;
    rootPath?: string;
    startPath?: string;
}
export declare const showBrowseFileDialog: (manager: IDocumentManager, options: IBrowseFileDialogOptions) => Promise<Dialog.IResult<any>>;
