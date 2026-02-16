import * as React from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { AutoSizer, CellMeasurer, InfiniteLoader, List, CellMeasurerCache } from 'react-virtualized';
import { Icon, Switch, Cell } from 'Component';
import { I, S, U, J, keyboard, translate, Storage, Relation, Dataview } from 'Lib';

const HEIGHT = 28;
const LIMIT = 20;

interface State {
	items: any[];
};

const MenuSubGroupList = observer(class MenuSubGroupList extends React.Component<I.Menu, State> {

	_isMounted = false;
	cache: any = {};
	listRef: any = null;
	top = 0;
	n = -1;

	state = {
		items: [],
	};

	constructor (props: I.Menu) {
		super(props);

		this.rebind = this.rebind.bind(this);
		this.onKeyDownHandler = this.onKeyDownHandler.bind(this);
		this.onScroll = this.onScroll.bind(this);
		this.resize = this.resize.bind(this);
	};

	render () {
		const { param, getId, setActive } = this.props;
		const { data } = param;
		const { readonly, rootId, blockId, getView } = data;
		const view = getView();
		const block = S.Block.getLeaf(rootId, blockId);
		const allowedView = S.Block.checkFlags(rootId, blockId, [ I.RestrictionDataview.View ]);
		const { items } = this.state;

		const Item = (item: any) => {
			const canHide = allowedView;
			const canEdit = !readonly && allowedView;
			// Use the same subId pattern as the subscription for Object relations
			// This ensures Cell can find the object details that were subscribed
			const subId = `${S.Record.getSubId(rootId, blockId)}/dep`;
			const cn = [ 'item' ];
			const head: any = {};

			head[view.subGroupRelationKey] = item.value;

			if (!canEdit) {
				cn.push('isReadonly');
			};

			return (
				<div
					id={'item-' + item.id}
					className={cn.join(' ')}
					onMouseEnter={e => this.onMouseEnter(e, item)}
				>
					<span className="clickable">
						<Cell
							id={'menu-subgroup-' + item.id}
							rootId={rootId}
							subId={subId}
							block={block}
							relationKey={view.subGroupRelationKey}
							viewType={I.ViewType.Board}
							getRecord={() => head}
							readonly={true}
							arrayLimit={4}
							withName={true}
							placeholder={translate('commonUncategorized')}
						/>
					</span>
					{canHide ? (
						<Switch
							value={!item.isHidden}
							onChange={(e: any, v: boolean) => this.onSwitch(e, item, v)}
						/>
					) : ''}
				</div>
			);
		};

		const rowRenderer = (param: any) => {
			const item: any = items[param.index];

			return (
				<CellMeasurer
					key={param.key}
					parent={param.parent}
					cache={this.cache}
					columnIndex={0}
					rowIndex={param.index}
				>
					<Item key={item.id} {...item} index={param.index} style={param.style} />
				</CellMeasurer>
			);
		};

		return (
			<div className="wrap">
				<div className="items">
					<InfiniteLoader
						rowCount={items.length}
						loadMoreRows={() => {}}
						isRowLoaded={() => true}
						threshold={LIMIT}
					>
						{({ onRowsRendered }) => (
							<AutoSizer className="scrollArea">
								{({ width, height }) => (
									<List
										ref={ref => this.listRef = ref}
										width={width}
										height={height}
										deferredMeasurmentCache={this.cache}
										rowCount={items.length}
										rowHeight={HEIGHT}
										rowRenderer={rowRenderer}
										onRowsRendered={onRowsRendered}
										overscanRowCount={LIMIT}
										onScroll={this.onScroll}
										scrollToAlignment="center"
									/>
								)}
							</AutoSizer>
						)}
					</InfiniteLoader>
				</div>
			</div>
		);
	};

	componentDidMount () {
		const { getId, setActive } = this.props;

		this._isMounted = true;
		this.loadItems();

		this.cache = new CellMeasurerCache({
			fixedWidth: true,
			defaultHeight: HEIGHT,
			keyMapper: i => (this.state.items[i] || {}).id,
		});

		this.rebind();
		this.resize();

		window.setTimeout(() => setActive(), 15);
	};

	componentDidUpdate () {
		this.resize();
		this.props.setActive();
		this.props.position();

		if (this.top) {
			this.listRef?.scrollToPosition(this.top);
		};
	};

	componentWillUnmount () {
		this._isMounted = false;
		this.unbind();
		S.Menu.closeAll(J.Menu.cell);
	};

	loadItems () {
		const { param } = this.props;
		const { data } = param;
		const { rootId, blockId, getView } = data;
		const view = getView();

		if (!view.subGroupRelationKey) {
			this.setState({ items: [] });
			return;
		};

		const relation = S.Record.getRelationByKey(view.subGroupRelationKey);
		if (!relation) {
			this.setState({ items: [] });
			return;
		};

		// Get hidden sub-group IDs from storage
		const hiddenIds = Storage.getViewSubGroupHidden(view.id);

		// Get sub-groups from the store (already loaded by the board component)
		// The board stores subgroups with key: blockId + '-subgroups'
		const groups = S.Record.getGroups(rootId, blockId + '-subgroups');

		if (!groups || !groups.length) {
			this.setState({ items: [] });
			return;
		};

		const items = groups.map((it: any) => {
			let value: any = it.value;

			switch (relation.format) {
				case I.RelationType.MultiSelect:
					value = Relation.getArrayValue(value);
					break;

				case I.RelationType.Object:
					value = Relation.getArrayValue(value);
					break;
			};

			return {
				id: it.id,
				value,
				isHidden: hiddenIds.includes(it.id),
			};
		});

		// For Object relations, subscribe to the referenced objects to load their details
		if (relation.format == I.RelationType.Object) {
			const objectIds = items.flatMap((g: any) => Relation.getArrayValue(g.value)).filter((id: string) => id);
			if (objectIds.length) {
				const subId = `${S.Record.getSubId(rootId, blockId)}/dep`;
				U.Subscription.subscribeIds({
					subId,
					ids: objectIds,
					noDeps: true,
				}, () => {
					if (this._isMounted) {
						this.setState({ items });
					};
				});
				return;
			};
		};

		this.setState({ items });
	};

	rebind () {
		this.unbind();
		$(window).on('keydown.menu', e => this.onKeyDownHandler(e));
	};

	unbind () {
		$(window).off('keydown.menu');
	};

	onKeyDownHandler (e: any) {
		const items = this.state.items;
		const item = items[this.n];

		let ret = false;

		keyboard.shortcut('space', e, () => {
			e.preventDefault();

			this.onSwitch(e, item, !item.isHidden);
			ret = true;
		});

		if (ret) {
			return;
		};

		this.props.onKeyDown(e);
	};

	onMouseEnter (e: any, item: any) {
		if (!keyboard.isMouseDisabled) {
			this.props.setActive(item, false);
		};
	};

	onSwitch (e: any, item: any, v: boolean) {
		e.stopPropagation();

		const { param } = this.props;
		const { data } = param;
		const { rootId, blockId, getView } = data;
		const view = getView();

		const hiddenIds = Storage.getViewSubGroupHidden(view.id);
		const idx = hiddenIds.indexOf(item.id);

		if (!v && idx < 0) {
			hiddenIds.push(item.id);
		} else if (v && idx >= 0) {
			hiddenIds.splice(idx, 1);
		};

		Storage.setViewSubGroupHidden(view.id, hiddenIds);

		// Update local state
		const items = this.state.items.map((it: any) => {
			if (it.id == item.id) {
				return { ...it, isHidden: !v };
			};
			return it;
		});
		this.setState({ items });

		// Update the store so the board re-renders
		S.Record.groupsSet(rootId, blockId + '-subgroups', items);
	};

	onScroll ({ scrollTop }: any) {
		if (scrollTop) {
			this.top = scrollTop;
		};
	};

	resize () {
		const { getId, position } = this.props;
		const items = this.state.items;
		const obj = $(`#${getId()} .content`);
		const height = Math.max(HEIGHT * 2, Math.min(360, items.length * HEIGHT + 16));

		obj.css({ height });
		position();
	};

	getItems () {
		return this.state.items;
	};

	getIndex () {
		return this.n;
	};

	setIndex (i: number) {
		this.n = i;
	};

	getListRef () {
		return this.listRef;
	};

});

export default MenuSubGroupList;
