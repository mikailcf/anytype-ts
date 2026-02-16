import * as React from 'react';
import { observer } from 'mobx-react';
import $ from 'jquery';
import { I, S, translate, Relation } from 'Lib';
import { Icon, Cell } from 'Component';
import Column from './column';

interface Props extends I.ViewComponent {
	subGroupId: string;
	subGroupValue: any;
	groups: any[];
	columnRefs: any;
	onDragStartColumn: (e: any, groupId: string) => void;
	onDragStartCard: (e: any, groupId: string, record: any) => void;
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
	};

	render () {
		const { rootId, block, subGroupId, subGroupValue, groups, getView, onDragStartColumn, onDragStartCard, columnRefs, getSubIdForSwimlane, onRefRecord } = this.props;
		const { isCollapsed } = this.state;
		const view = getView();
		const relation = S.Record.getRelationByKey(view.subGroupRelationKey);
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
								arrayLimit={4}
								withName={true}
								placeholder={translate('commonUncategorized')}
							/>
							<span className="count">{this.getCount()}</span>
						</div>
					</div>
				</div>

				{!isCollapsed ? (
					<div className="swimlaneBody">
						<div className="columns">
							{groups.map((group: any, i: number) => (
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
