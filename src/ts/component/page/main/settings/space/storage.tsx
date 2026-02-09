import * as React from 'react';
import { observer } from 'mobx-react';
import { Title, ListObjectManager, Label, ProgressBar } from 'Component';
import { I, J, U, S, translate, Action, analytics } from 'Lib';

const PageMainSettingsStorage = observer(class PageMainSettingsStorage extends React.Component<I.PageSettingsComponent, {}> {

	node = null;
	refManager = null;

	constructor (props: I.PageSettingsComponent) {
		super(props);

		this.onRemove = this.onRemove.bind(this);
	};

	render () {
		const { spaceStorage } = S.Common;
		const { localUsage, bytesLimit } = spaceStorage;
		const spaces = U.Space.getList();
		const currentSpace = U.Space.getSpaceview();
		const canWrite = U.Space.canMyParticipantWrite();

		const segments: any = {
			current: { name: currentSpace.name, usage: 0, className: 'current', },
		};

		let bytesUsed = 0;

		(spaces || []).forEach((space) => {
			const object: any = S.Common.spaceStorage.spaces.find(it => it.spaceId == space.targetSpaceId) || {};
			const usage = Number(object.bytesUsage) || 0;
			const isOwner = U.Space.isMyOwner(space.targetSpaceId);
			const isCurrent = space.targetSpaceId == currentSpace.targetSpaceId;

			if (!isOwner) {
				return;
			};

			bytesUsed += usage;
			if (isCurrent) {
				segments.current.usage = usage;
			} else {
				if (segments.other) {
					segments.other.usage += usage;
				} else {
					segments.other = { name: translate('popupSettingsSpaceStorageProgressBarOther'), usage, className: 'other' };
				};
			};
		});

		const chunks: any[] = Object.values(segments);
		const progressSegments = (chunks || []).map(chunk => {
			const { name, usage, className } = chunk;

			return { name, className, caption: U.File.size(usage), percent: bytesLimit ? usage / bytesLimit : 0, isActive: true, };
		});

		const legend = chunks.concat([ { name: translate('popupSettingsSpaceStorageProgressBarFree'), usage: bytesLimit - bytesUsed, className: 'free' } ]);

		const filters: I.Filter[] = [
			{ relationKey: 'layout', condition: I.FilterCondition.In, value: U.Object.getFileLayouts() },
		];
		const sorts: I.Sort[] = [
			{ type: I.SortType.Desc, relationKey: 'sizeInBytes' },
		];
		const buttons: I.ButtonComponent[] = [
			{ icon: 'remove', text: translate('commonDeleteImmediately'), onClick: () => this.onRemove() }
		];

		return (
			<div ref={ref => this.node = ref} className="wrap">
				<Title text={translate(`pageSettingsSpaceRemoteStorage`)} />
				<Label text={translate(`popupSettingsSpaceIndexStorageText`)} />

				<div className="item usageWrapper">
					<ProgressBar segments={progressSegments} />

					<div className="info">
						<div className="totalUsage">
							<span>{U.File.size(bytesUsed, true)} </span>
							{bytesLimit ? U.Common.sprintf(translate('popupSettingsSpaceStorageProgressBarUsageLabel'), U.File.size(bytesLimit, true)) : ''}
						</div>

						<div className="legend">
							{legend.map((item, idx) => (
								<div key={idx} className={[ 'item', item.className ].join(' ')}>{item.name}</div>
							))}
						</div>
					</div>
				</div>

				{canWrite ? (
					<div className="fileManagerWrapper">
						<Title className="sub" text={translate('pageSettingsSpaceStorageFiles')} />

						<ListObjectManager
							ref={ref => this.refManager = ref}
							subId={J.Constant.subId.fileManagerSynced}
							rowLength={2}
							buttons={buttons}
							info={I.ObjectManagerItemInfo.FileSize}
							iconSize={18}
							sorts={sorts}
							filters={filters}
							ignoreHidden={false}
							ignoreArchived={false}
							textEmpty={translate('popupSettingsSpaceStorageEmptyLabel')}
						/>
					</div>
				) : ''}
			</div>
		);
	};

	componentWillUnmount () {
		U.Subscription.destroyList([ J.Constant.subId.fileManagerSynced ]);
	};

	onRemove () {
		if (this.refManager) {
			Action.delete(this.refManager.getSelected(), analytics.route.settings, () => this.refManager?.selectionClear());
		};
	};

	resize () {
		const { isPopup } = this.props;
		const node = $(this.node);
		const sc = U.Common.getScrollContainer(isPopup);
		const height = sc.height() - J.Size.header - 36;

		node.css({ height });
	};

});

export default PageMainSettingsStorage;
