/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as path from 'path';
import { ISiteTreeRoot } from 'vscode-azureappservice';
import { AzureParentTreeItem, AzureTreeItem, GenericTreeItem } from 'vscode-azureextensionui';
import { resourcesPath } from '../constants';

export class WebJobsTreeItem extends AzureParentTreeItem<ISiteTreeRoot> {
    public static contextValue: string = 'webJobs';
    public readonly label: string = 'WebJobs';
    public readonly contextValue: string = WebJobsTreeItem.contextValue;
    public readonly childTypeLabel: string = 'Web Job';

    public get id(): string {
        return 'webJobs';
    }

    public get iconPath(): { light: string, dark: string } {
        return {
            light: path.join(resourcesPath, 'light', 'WebJobs_color.svg'),
            dark: path.join(resourcesPath, 'dark', 'WebJobs_color.svg')
        };
    }

    public hasMoreChildrenImpl(): boolean {
        return false;
    }

    public async loadMoreChildrenImpl(_clearCache: boolean): Promise<AzureTreeItem<ISiteTreeRoot>[]> {
        const jobList: webJob[] = <webJob[]>await this.root.client.kudu.jobs.listAllJobs();

        return jobList.map((job: webJob) => {
            return new GenericTreeItem<ISiteTreeRoot>(this, { id: job.name, label: job.name, contextValue: 'webJob' });
        });
    }
}

type webJob = { name: string, Message: string };
