// WIP: https://github.com/sindresorhus/refined-github/issues/2268
import React from 'dom-chef';
import select from 'select-dom';
import * as api from '../libs/api';
import features from '../libs/features';
// TODO: import {isRepoWithAccess} from '../libs/page-detect';
import {getRepoGQL} from '../libs/utils';

interface Response {
	repository: {
		refs: {
			nodes: Array<{
				associatedPullRequests: {
					nodes: Array<{
						isCrossRepository: boolean;
					}>;
				};
			}>;
		};
	};
}

async function init(): Promise<void> {
	// TODO: Enable this, just for testing with other repos right now
	// if (!isRepoWithAccess()) {
	// 	return;
	// }

	const forkFlag = select('.repohead-details-container .fork-flag');
	if (!forkFlag) {
		return;
	}

	const {repository} = await api.v4(`
		repository(${getRepoGQL()}) {
			refs(refPrefix: "refs/heads/", first: 100) {
				nodes {
					associatedPullRequests(states:OPEN, first: 100) {
						nodes {
							isCrossRepository
						}
					}
				}
			}
		}
	`) as Response;

	const prs = repository.refs.nodes.reduce(
		(sum, {associatedPullRequests}) =>
			sum + associatedPullRequests.nodes.reduce(
				(sum, pr) => sum + (pr.isCrossRepository ? 1 : 0),
				0
			),
		0
	);

	forkFlag.append(
		<i>
			({prs} open PR{prs === 1 ? '' : 's'})
		</i>
	);

	if (prs > 0) {
		const prTabCounter = select(
			'a[data-selected-links^="repo_pulls"] .Counter'
		)!;
		prTabCounter.textContent += ` +${prs}`;
	}

	const deleteBox = select(
		'details-dialog[aria-label="Delete repository"] .Box-body'
	);
	if (deleteBox) {
		const message =
			prs === 0 ?
				'No open PRs.' :
				`You still have ${prs} open PR${prs === 1 ? '' : 's'}!`;
		deleteBox.prepend(<p>{message}</p>);
	}
}

features.add({
	id: __featureName__,
	description: 'Find open PRs on your forks.',
	screenshot: false,
	include: [features.isRepo],
	load: features.onAjaxedPages,
	init
});
