import * as React from 'react';
import { observer } from 'mobx-react';
import { I, S, translate, Storage } from 'Lib';
import { Icon, Cell } from 'Component';
import Column from './column';

interface Props extends I.ViewComponent {
	subGroupId: string;
	subGroupValue: any;
	subGroupIndex: number;
	subGroupCount: number;
	groups: any[];
	columnRefs: any;
	onDragStartColumn: (e: any, groupId: string) => void;
	onDragStartCard: (e: any, groupId: string, record: any) => void;
	onSubGroupOrderChange: () => void;
	getSubIdForSwimlane: (groupId: string, subGroupId: string) => string;
};

interface State {
	isCollapsed: boolean;
};

const Swimlane = observer(class Swimlane extends React.Component<Props, State> {

	node: any = null;

	state = {
		isCollapsed: false,
	};

	constructor (props: Props) {
		super(props);
		this.onToggle = this.onToggle.bind(this);
		this.onMore = this.onMore.bind(this);
	};

	render () {
		const { rootId, block, subGroupId, subGroupValue, groups, getView, onDragStartColumn, onDragStartCard, columnRefs, getSubIdForSwimlane } = this.props;
		const { isCollapsed } = this.state;
		const view = getView();
		const cn = [ 'swimlane' ];
		const head = {};
		const depSubId = `${S.Record.getSubId(rootId, block.id)}/dep`;

		if (isCollapsed) {
			cn.push('isCollapsed');
		};

		head[view.subGroupRelationKey] = subGroupValue;

		return (
			<div
				ref={node => this.node = node}
				id={`swimlane-${subGroupId}`}
				className={cn.join(' ')}
			>
				<div className="swimlaneHead" onClick={this.onToggle}>
					<div className="sides">
						<div className="side left">
							<Icon className={`arrow ${isCollapsed ? '' : 'expanded'}`} />
							<Cell
								id={`swimlane-head-${subGroupId}`}
								rootId={rootId}
								subId={depSubId}
								block={block}
								relationKey={view.subGroupRelationKey}
								viewType={I.ViewType.Board}
								getRecord={() => head}
								readonly={true}
								forcePlaceholder={true}
								arrayLimit={4}
								withName={true}
								placeholder={translate('placeholderCellCommon')}
							/>
							<Icon
								id={`swimlane-${subGroupId}-more`}
								className="more"
								onClick={this.onMore}
							/>
						</div>
					</div>
				</div>

				{!isCollapsed ? (
					<div className="swimlaneBody">
						<div className="columns">
							{groups.map((group: any) => (
								<Column
									key={`board-column-${subGroupId}-${group.id}`}
									ref={ref => columnRefs[`${subGroupId}-${group.id}`] = ref}
									{...this.props}
									{...group}
									subGroupId={subGroupId}
									subGroupValue={subGroupValue}
									onDragStartColumn={onDragStartColumn}
									onDragStartCard={onDragStartCard}
									getSubId={() => getSubIdForSwimlane(group.id, subGroupId)}
								/>
							))}
						</div>
					</div>
				) : ''}
			</div>
		);
	};

	onToggle (e: any) {
		e.preventDefault();
		e.stopPropagation();

		this.setState({ isCollapsed: !this.state.isCollapsed });
	};

	onMore (e: any) {
		e.preventDefault();
		e.stopPropagation();

		const { subGroupId, subGroupIndex, subGroupCount, getView, onSubGroupOrderChange } = this.props;
		const view = getView();
		const element = `#swimlane-${subGroupId}-more`;

		const options = [
			{ id: 'moveUp', name: 'Move Up', disabled: subGroupIndex === 0 },
			{ id: 'moveDown', name: 'Move Down', disabled: subGroupIndex === subGroupCount - 1 },
		];

		S.Menu.open('select', {
			element,
			horizontal: I.MenuDirection.Center,
			offsetY: 4,
			data: {
				options,
				noFilter: true,
				noVirtualisation: true,
				onSelect: (e: any, item: any) => {
					if (item.id === 'moveUp') {
						this.moveSubGroup(view.id, subGroupIndex, subGroupIndex - 1);
					} else if (item.id === 'moveDown') {
						this.moveSubGroup(view.id, subGroupIndex, subGroupIndex + 1);
					};
					onSubGroupOrderChange();
				}
			}
		});
	};

	moveSubGroup (viewId: string, fromIndex: number, toIndex: number) {
		const { rootId, block } = this.props;
		const subGroups = S.Record.getGroups(rootId, block.id + '-subgroups') || [];

		if (toIndex < 0 || toIndex >= subGroups.length) {
			return;
		};

		// Get current order from storage or use default
		const order = Storage.getViewSubGroupOrder(viewId);
		const visibleSubGroups = subGroups.filter((it: any) => !it.isHidden);
		const visibleIds = visibleSubGroups.map((it: any) => it.id);

		// If no stored order, use current visible order
		let orderedIds = order.length ? order : visibleIds;

		// Make sure all visible sub-groups are in the order
		visibleIds.forEach((id: string) => {
			if (!orderedIds.includes(id)) {
				orderedIds.push(id);
			};
		});

		// Remove any ids that are no longer visible
		orderedIds = orderedIds.filter((id: string) => visibleIds.includes(id));

		// Swap the positions
		const [removed] = orderedIds.splice(fromIndex, 1);
		orderedIds.splice(toIndex, 0, removed);

		// Save the new order
		Storage.setViewSubGroupOrder(viewId, orderedIds);
	};

	getCount (): number {
		const { groups, getSubIdForSwimlane, subGroupId } = this.props;
		let count = 0;

		groups.forEach((group: any) => {
			const subId = getSubIdForSwimlane(group.id, subGroupId);
			const { total } = S.Record.getMeta(subId, '');
			count += total || 0;
		});

		return count;
	};

});

export default Swimlane;
