import * as React from 'react';
import { observer } from 'mobx-react';
import { arrayMove } from '@dnd-kit/sortable';
import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { restrictToVerticalAxis, restrictToFirstScrollableAncestor } from '@dnd-kit/modifiers';
import $ from 'jquery';
import raf from 'raf';
import { I, C, S, U, J, Dataview, keyboard, translate, Relation, Storage } from 'Lib';
import Empty from '../empty';
import Column from './board/column';
import Swimlane from './board/swimlane';

const PADDING = 46;

interface State {
	subGroups: any[];
};

const ViewBoard = observer(class ViewBoard extends React.Component<I.ViewComponent, State> {

	node: any = null;
	cache: any = {};
	frame = 0;
	newIndex = -1;
	newGroupId = '';
	newSubGroupId = '';
	columnRefs: any = {};
	isDraggingColumn = false;
	isDraggingCard = false;
	ox = 0;
	creating = false;
	hoverId = '';

	state = {
		subGroups: [],
	};

	constructor (props: I.ViewComponent) {
		super(props);

		this.onDragStartColumn = this.onDragStartColumn.bind(this);
		this.onDragStartCard = this.onDragStartCard.bind(this);
		this.getSubIdWithSubGroup = this.getSubIdWithSubGroup.bind(this);
		this.onDragStartSwimlane = this.onDragStartSwimlane.bind(this);
		this.onDragEndSwimlane = this.onDragEndSwimlane.bind(this);
	};

	render () {
		const { rootId, block, getView, className, onViewSettings } = this.props;
		const view = getView();
		const groups = this.getGroups(false);
		const relation = S.Record.getRelationByKey(view.groupRelationKey);
		const subGroupRelation = view.subGroupRelationKey ? S.Record.getRelationByKey(view.subGroupRelationKey) : null;

		// Read sub-groups directly from the store to get MobX reactivity
		const subGroups = S.Record.getGroups(rootId, block.id + '-subgroups');
		// Filter out hidden sub-groups and apply order
		const visibleSubGroups = this.applySubGroupOrder(view.id, (subGroups || []).filter((it: any) => !it.isHidden));
		const hasSubGroups = subGroupRelation && visibleSubGroups.length > 0;
		const cn = [ 'viewContent', className ];

		if (hasSubGroups) {
			cn.push('withSwimlanes');
		};

		if (!relation) {
			return (
				<Empty
					{...this.props}
					title={translate('blockDataviewBoardRelationDeletedTitle')}
					description={translate('blockDataviewBoardRelationDeletedDescription')}
					button={translate('blockDataviewBoardOpenViewMenu')}
					className="withHead"
					onClick={onViewSettings}
				/>
			);
		};

		return (
			<div
				ref={node => this.node = node}
				id="scrollWrap"
				className="scrollWrap"
			>
				<div id="scroll" className="scroll">
					<div className={cn.join(' ')}>
						{hasSubGroups ? (
							<DndContext
								collisionDetection={closestCenter}
								onDragStart={this.onDragStartSwimlane}
								onDragEnd={this.onDragEndSwimlane}
								modifiers={[restrictToVerticalAxis, restrictToFirstScrollableAncestor]}
							>
								<SortableContext
									items={visibleSubGroups.map((sg: any) => sg.id)}
									strategy={verticalListSortingStrategy}
								>
									<div id="swimlanes" className="swimlanes">
										{visibleSubGroups.map((subGroup: any, i: number) => (
											<Swimlane
												key={`board-swimlane-${subGroup.id}`}
												{...this.props}
												subGroupId={subGroup.id}
												subGroupValue={subGroup.value}
												subGroupIndex={i}
												subGroupCount={visibleSubGroups.length}
												groups={groups}
												columnRefs={this.columnRefs}
												onDragStartColumn={this.onDragStartColumn}
												onDragStartCard={this.onDragStartCard}
												onSubGroupOrderChange={() => this.forceUpdate()}
												getSubIdForSwimlane={this.getSubIdWithSubGroup}
											/>
										))}
									</div>
								</SortableContext>
							</DndContext>
						) : (
							<div id="columns" className="columns">
								{groups.map((group: any, i: number) => (
									<Column
										key={`board-column-${group.id}`}
										ref={ref => this.columnRefs[group.id] = ref}
										{...this.props}
										{...group}
										onDragStartColumn={this.onDragStartColumn}
										onDragStartCard={this.onDragStartCard}
										getSubId={() => this.getSubId(group.id)}
									/>
								))}
							</div>
						)}
					</div>
				</div>
			</div>
		);
	};

	componentDidMount () {
		this.resize();
		this.rebind();
	};

	componentDidUpdate () {
		this.resize();
		U.Common.triggerResizeEditor(this.props.isPopup);

		const selection = S.Common.getRef('selectionProvider');
		const ids = selection?.get(I.SelectType.Record) || [];

		if (ids.length) {
			selection?.renderSelection();
		};
	};

	componentWillUnmount () {
		this.unbind();
	};

	rebind () {
		this.unbind();

		const node = $(this.node);
		node.find('#scroll').on('scroll', () => this.onScrollView());
	};

	unbind () {
		const node = $(this.node);
		node.find('#scroll').off('scroll');
	};

	loadGroupList () {
		const { rootId, block, getView, getTarget } = this.props;
		const object = getTarget();
		const view = getView();

		S.Record.groupsClear(rootId, block.id);

		if (!view.groupRelationKey) {
			this.forceUpdate();
			return;
		};

		Dataview.loadGroupList(rootId, block.id, view.id, object);

		// Load sub-groups if sub-group relation is set
		if (view.subGroupRelationKey) {
			this.loadSubGroupList();
		} else {
			this.setState({ subGroups: [] });
		};
	};

	loadSubGroupList () {
		const { rootId, block, getView, getTarget } = this.props;
		const object = getTarget();
		const view = getView();

		if (!view.subGroupRelationKey) {
			this.setState({ subGroups: [] });
			return;
		};

		const relation = S.Record.getRelationByKey(view.subGroupRelationKey);
		if (!relation) {
			this.setState({ subGroups: [] });
			return;
		};

		const subId = S.Record.getGroupSubId(rootId, block.id, 'subgroups');
		const isCollection = U.Object.isCollectionLayout(object.layout);

		C.ObjectGroupsSubscribe(S.Common.space, subId, view.subGroupRelationKey, view.filters.map(Dataview.filterMapper), object.setOf || [], isCollection ? object.id : '', (message: any) => {
			if (message.error.code) {
				return;
			};

			// Get hidden sub-group IDs from storage
			const hiddenIds = Storage.getViewSubGroupHidden(view.id);

			const subGroups = (message.groups || []).map((it: any) => {
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

			// Store all sub-groups in Record store for the sub-group menu to access
			S.Record.groupsSet(rootId, block.id + '-subgroups', subGroups);

			// For Object relations, subscribe to the referenced objects to load their details
			if (relation.format == I.RelationType.Object) {
				const objectIds = subGroups.flatMap(g => Relation.getArrayValue(g.value)).filter(id => id);
				if (objectIds.length) {
					const depSubId = `${S.Record.getSubId(rootId, block.id)}/dep`;
					U.Subscription.subscribeIds({
						subId: depSubId,
						ids: objectIds,
						noDeps: true,
					}, () => {
						this.setState({ subGroups });
					});
					return;
				};
			};

			this.setState({ subGroups });
		});
	};

	getGroups (withHidden: boolean) {
		const { rootId, block, getView } = this.props;
		const view = getView();
		if (!view) {
			return [];
		};

		return Dataview.getGroups(rootId, block.id, view.id, withHidden);
	};

	initCacheColumn () {
		const groups = this.getGroups(true);
		const node = $(this.node);

		this.cache = {};
		groups.forEach((group: any, i: number) => {
			const el = node.find(`#column-${group.id}`);
			const item = {
				id: group.id,
				index: i,
				x: 0,
				y: 0,
				width: 0,
				height: 0,
			};

			if (el.length) {
				const { left, top } = el.offset();

				item.x = left;
				item.y = top;
				item.width = el.outerWidth();
				item.height = el.outerHeight();
			};
			
			this.cache[group.id] = item;
		});
	};

	initCacheCard () {
		const { rootId, block, getView } = this.props;
		const view = getView();
		const groups = this.getGroups(false);
		const node = $(this.node);
		const hasSubGroups = view.subGroupRelationKey && S.Record.getGroups(rootId, block.id + '-subgroups')?.some((it: any) => !it.isHidden);

		this.cache = {};

		if (hasSubGroups) {
			// Swimlane mode: iterate through sub-groups and groups with composite keys
			const subGroups = S.Record.getGroups(rootId, block.id + '-subgroups').filter((it: any) => !it.isHidden);
			subGroups.forEach((subGroup: any) => {
				groups.forEach((group: any) => {
					const columnKey = `${subGroup.id}-${group.id}`;
					const column = this.columnRefs[columnKey];
					if (!column) {
						return;
					};

					const items = column.getItems() || [];
					items.push({ id: `${columnKey}-add`, isAdd: true });
					items.forEach((item: any, i: number) => {
						const el = node.find(`#record-${item.id}`);
						if (!el.length) {
							return;
						};

						const { left, top } = el.offset();
						this.cache[item.id] = {
							id: item.id,
							groupId: group.id,
							subGroupId: subGroup.id,
							x: left,
							y: top,
							width: el.outerWidth(),
							height: el.outerHeight(),
							index: i,
							isAdd: item.isAdd,
						};
					});
				});
			});
		} else {
			// Non-swimlane mode: original logic
			groups.forEach((group: any, i: number) => {
				const column = this.columnRefs[group.id];
				if (!column) {
					return;
				};

				const items = column.getItems() || [];

				items.push({ id: `${group.id}-add`, isAdd: true });
				items.forEach((item: any, i: number) => {
					const el = node.find(`#record-${item.id}`);
					if (!el.length) {
						return;
					};

					const { left, top } = el.offset();
					this.cache[item.id] = {
						id: item.id,
						groupId: group.id,
						x: left,
						y: top,
						width: el.outerWidth(),
						height: el.outerHeight(),
						index: i,
						isAdd: item.isAdd,
					};
				});
			});
		};
	};

	onDragStartCommon (e: any, target: any) {
		e.stopPropagation();

		const { rootId, block, getView } = this.props;
		const view = getView();
		const selection = S.Common.getRef('selectionProvider');
		const node = $(this.node);
		const viewContent = node.find('.viewContent');
		const clone = target.clone();

		// Determine offset based on whether we're in swimlane mode
		const hasSubGroups = view.subGroupRelationKey && S.Record.getGroups(rootId, block.id + '-subgroups')?.some((it: any) => !it.isHidden);

		if (hasSubGroups) {
			// In swimlane mode, columns are nested inside swimlanes with class "columns"
			const firstSwimlaneColumns = node.find('.swimlane .columns').first();
			this.ox = firstSwimlaneColumns.length ? firstSwimlaneColumns.offset().left : 0;
		} else {
			// In regular mode, columns are directly under #columns
			const columnsEl = node.find('#columns');
			this.ox = columnsEl.length ? columnsEl.offset().left : 0;
		};

		target.addClass('isDragging');
		clone.attr({ id: '' }).addClass('isClone').css({ zIndex: 10000, position: 'fixed', left: -10000, top: -10000 });
		viewContent.append(clone);

		$(document).off('dragover').on('dragover', e => e.preventDefault());
		$(window).off('dragend.board drag.board');
		$('body').addClass('grab');

		e.dataTransfer.setDragImage(clone.get(0), 0, 0);

		keyboard.setDragging(true);
		keyboard.disableSelection(true);
		keyboard.disableCommonDrop(true);

		selection.clear();
	};

	onDragEndCommon (e: any) {
		e.preventDefault();

		const node = $(this.node);

		$('body').removeClass('grab');
		$(window).off('dragend.board drag.board').trigger('mouseup.selection');

		node.find('.isClone').remove();
		node.find('.isDragging').removeClass('isDragging');
		node.find('.isOver').removeClass('isOver left right top bottom');

		keyboard.disableSelection(false);
		keyboard.disableCommonDrop(false);
		keyboard.setDragging(false);

		if (this.frame) {
			raf.cancel(this.frame);
			this.frame = 0;
		};
	};

	onDragStartColumn (e: any, groupId: string) {
		const { readonly } = this.props;
		if (readonly) {
			e.preventDefault();
			e.stopPropagation();
			return;
		};

		const win = $(window);
		const node = $(this.node);

		this.onDragStartCommon(e, node.find(`#column-${groupId}`));
		this.initCacheColumn();
		this.isDraggingColumn = true;

		win.on('drag.board', e => this.onDragMoveColumn(e, groupId));
		win.on('dragend.board', e => this.onDragEndColumn(e, groupId));
	};

	onDragMoveColumn (e: any, groupId: any) {
		const node = $(this.node);
		const current = this.cache[groupId];
		const groups = this.getGroups(false);

		if (!current) {
			return;
		};

		let isLeft = false;

		this.hoverId = '';

		for (const group of groups) {
			const rect = this.cache[group.id];
			if (!rect || (group.id == groupId)) {
				continue;
			};

			if (rect && this.cache[groupId] && U.Common.rectsCollide({ x: e.pageX, y: e.pageY, width: current.width, height: current.height }, rect)) {
				isLeft = e.pageX <= rect.x + rect.width / 2;
				this.hoverId = group.id;

				this.newIndex = rect.index;

				if (isLeft && (rect.index > current.index)) {
					this.newIndex--;
				};

				if (!isLeft && (rect.index < current.index)) {
					this.newIndex++;
				};
				break;
			};
		};

		if (this.frame) {
			raf.cancel(this.frame);
			this.frame = 0;
		};

		this.frame = raf(() => {
			node.find('.isOver').removeClass('isOver left right');

			if (this.hoverId) {
				node.find(`#column-${this.hoverId}`).addClass('isOver ' + (isLeft ? 'left' : 'right'));
			};
		});
	};

	onDragEndColumn (e: any, groupId: string) {
		const { rootId, block, getView } = this.props;

		if (this.hoverId) {
			const view = getView();
			const update: any[] = [];
			const current = this.cache[groupId];

			let groups = this.getGroups(true);
			groups = arrayMove(groups, current.index, this.newIndex);
			S.Record.groupsSet(rootId, block.id, groups);

			groups.forEach((it: any, i: number) => {
				update.push({ ...it, groupId: it.id, index: i });
			});

			Dataview.groupUpdate(rootId, block.id, view.id, update);
			C.BlockDataviewGroupOrderUpdate(rootId, block.id, { viewId: view.id, groups: update });
		};

		this.cache = {};
		this.isDraggingColumn = false;
		this.onDragEndCommon(e);
		this.resize();
	};

	onDragStartCard (e: any, groupId: any, record: any) {
		const { readonly } = this.props;
		if (readonly) {
			e.preventDefault();
			e.stopPropagation();
			return;
		};

		const win = $(window);

		this.onDragStartCommon(e, $(e.currentTarget));
		this.initCacheCard();
		this.isDraggingCard = true;

		win.on('drag.board', e => this.onDragMoveCard(e, record));
		win.on('dragend.board', e => this.onDragEndCard(e, record));
	};

	onDragMoveCard (e: any, record: any) {
		const node = $(this.node);
		const current = this.cache[record.id];

		if (!current) {
			return;
		};

		let isTop = false;
		
		this.hoverId = '';

		for (const i in this.cache) {
			const rect = this.cache[i];
			if (!rect || (rect.id == record.id)) {
				continue;
			};

			if (U.Common.rectsCollide({ x: e.pageX, y: e.pageY, width: current.width, height: current.height + 8 }, rect)) {
				isTop = rect.isAdd || (e.pageY <= rect.y + rect.height / 2);

				this.hoverId = rect.id;
				this.newGroupId = rect.groupId;
				this.newSubGroupId = rect.subGroupId || '';
				this.newIndex = isTop ? rect.index : rect.index + 1;
				break;
			};
		};

		if (this.frame) {
			raf.cancel(this.frame);
			this.frame = 0;
		};

		this.frame = raf(() => {
			node.find('.isOver').removeClass('isOver top bottom');

			if (this.hoverId) {
				node.find(`#record-${this.hoverId}`).addClass('isOver ' + (isTop ? 'top' : 'bottom'));
			};
		});
	};

	onDragEndCard (e: any, record: any) {
		const current = this.cache[record.id];

		this.onDragEndCommon(e);
		this.cache = {};
		this.isDraggingCard = false;

		if (!current) {
			return;
		};

		if (!this.hoverId || !current.groupId || !this.newGroupId || ((current.index == this.newIndex) && (current.groupId == this.newGroupId))) {
			return;
		};

		const { rootId, block, getView, objectOrderUpdate } = this.props;
		const view = getView();
		const hasSubGroups = view.subGroupRelationKey && S.Record.getGroups(rootId, block.id + '-subgroups')?.some((it: any) => !it.isHidden);

		// Build subscription IDs - use composite key for swimlanes
		const currentSubGroupId = current.subGroupId || '';
		const oldGroupKey = hasSubGroups ? `${current.groupId}-${currentSubGroupId}` : current.groupId;
		const newGroupKey = hasSubGroups ? `${this.newGroupId}-${this.newSubGroupId}` : this.newGroupId;
		const oldSubId = S.Record.getGroupSubId(rootId, block.id, oldGroupKey);
		const newSubId = S.Record.getGroupSubId(rootId, block.id, newGroupKey);

		const newGroup = S.Record.getGroup(rootId, block.id, this.newGroupId);
		const newSubGroup = hasSubGroups ? S.Record.getGroups(rootId, block.id + '-subgroups').find((it: any) => it.id === this.newSubGroupId) : null;

		const groupChange = current.groupId != this.newGroupId;
		const subGroupChange = hasSubGroups && currentSubGroupId && this.newSubGroupId && currentSubGroupId !== this.newSubGroupId;
		const change = groupChange || subGroupChange;

		let records: any[] = [];
		let orders: any[] = [];

		if (change) {
			S.Detail.update(newSubId, { id: record.id, details: record }, true);
			S.Detail.delete(oldSubId, record.id, Object.keys(record));

			S.Record.recordDelete(oldSubId, '', record.id);
			S.Record.recordAdd(newSubId, '', record.id, this.newIndex);

			// Build details to update
			const details: { key: string; value: any }[] = [];
			if (groupChange && newGroup) {
				details.push({ key: view.groupRelationKey, value: newGroup.value });
			};
			if (subGroupChange && newSubGroup) {
				details.push({ key: view.subGroupRelationKey, value: newSubGroup.value });
			};

			C.ObjectListSetDetails([ record.id ], details, () => {
				orders = [
					{ viewId: view.id, groupId: oldGroupKey, objectIds: S.Record.getRecordIds(oldSubId, '') },
					{ viewId: view.id, groupId: newGroupKey, objectIds: S.Record.getRecordIds(newSubId, '') }
				];

				objectOrderUpdate(orders, records);
			});
		} else {
			if (current.index + 1 == this.newIndex) {
				return;
			};

			if (this.newIndex > current.index) {
				this.newIndex -= 1;
			};

			records = arrayMove(S.Record.getRecordIds(oldSubId, ''), current.index, this.newIndex);
			orders = [ { viewId: view.id, groupId: oldGroupKey, objectIds: records } ];

			objectOrderUpdate(orders, records, () => S.Record.recordsSet(oldSubId, '', records));
		};
	};

	onScrollView () {
		const { rootId, block, getView } = this.props;
		const view = getView();
		const groups = this.getGroups(false);
		const node = $(this.node);
		const hasSubGroups = view.subGroupRelationKey && S.Record.getGroups(rootId, block.id + '-subgroups')?.some((it: any) => !it.isHidden);

		if (this.isDraggingColumn) {
			groups.forEach((group: any, i: number) => {
				const rect = this.cache[group.id];
				if (!rect) {
					return;
				};

				const el = node.find(`#column-${group.id}`);
				if (!el.length) {
					return;
				};

				const { left, top } = el.offset();
				rect.x = left;
				rect.y = top;
			});
		} else
		if (this.isDraggingCard) {
			if (hasSubGroups) {
				// Swimlane mode: iterate through sub-groups and groups with composite keys
				const subGroups = S.Record.getGroups(rootId, block.id + '-subgroups').filter((it: any) => !it.isHidden);
				subGroups.forEach((subGroup: any) => {
					groups.forEach((group: any) => {
						const columnKey = `${subGroup.id}-${group.id}`;
						const column = this.columnRefs[columnKey];
						if (!column) {
							return;
						};

						// Update positions for all cards
						const items = column.getItems() || [];
						items.forEach((item: any, i: number) => {
							const el = node.find(`#record-${item.id}`);
							if (!el.length) {
								return;
							};

							const { left, top } = el.offset();
							if (this.cache[item.id]) {
								this.cache[item.id].x = left;
								this.cache[item.id].y = top;
							};
						});

						// Also update the "add" card position
						const addCardId = `${columnKey}-add`;
						const addEl = node.find(`#record-${addCardId}`);
						if (addEl.length && this.cache[addCardId]) {
							const { left, top } = addEl.offset();
							this.cache[addCardId].x = left;
							this.cache[addCardId].y = top;
						};
					});
				});
			} else {
				groups.forEach((group: any, i: number) => {
					const column = this.columnRefs[group.id];
					if (!column) {
						return;
					};

					// Update positions for all cards
					const items = column.getItems() || [];
					items.forEach((item: any, i: number) => {
						const el = node.find(`#record-${item.id}`);
						if (!el.length) {
							return;
						};

						const { left, top } = el.offset();
						if (this.cache[item.id]) {
							this.cache[item.id].x = left;
							this.cache[item.id].y = top;
						};
					});

					// Also update the "add" card position
					const addCardId = `${group.id}-add`;
					const addEl = node.find(`#record-${addCardId}`);
					if (addEl.length && this.cache[addCardId]) {
						const { left, top } = addEl.offset();
						this.cache[addCardId].x = left;
						this.cache[addCardId].y = top;
					};
				});
			};
		};
	};

	getSubId (id: string): string {
		const { rootId, block } = this.props;

		return S.Record.getGroupSubId(rootId, block.id, id);
	};

	getSubIdWithSubGroup (groupId: string, subGroupId: string): string {
		const { rootId, block } = this.props;

		return S.Record.getGroupSubId(rootId, block.id, `${groupId}-${subGroupId}`);
	};

	applySubGroupOrder (viewId: string, subGroups: any[]): any[] {
		if (!subGroups.length) {
			return subGroups;
		};

		const order = Storage.getViewSubGroupOrder(viewId);
		if (!order.length) {
			return subGroups;
		};

		const orderMap: any = {};
		order.forEach((id, i) => orderMap[id] = i);

		return [...subGroups].sort((a, b) => {
			const idxA = orderMap[a.id];
			const idxB = orderMap[b.id];

			if (idxA !== undefined && idxB !== undefined) {
				return idxA - idxB;
			};
			if (idxA !== undefined) return -1;
			if (idxB !== undefined) return 1;
			return 0;
		});
	};

	onDragStartSwimlane () {
		keyboard.disableSelection(true);
	};

	onDragEndSwimlane (result: any) {
		keyboard.disableSelection(false);

		const { active, over } = result;
		if (!active || !over || active.id === over.id) {
			return;
		};

		const { rootId, block, getView } = this.props;
		const view = getView();
		const subGroups = S.Record.getGroups(rootId, block.id + '-subgroups') || [];
		const visibleSubGroups = subGroups.filter((it: any) => !it.isHidden);
		const orderedSubGroups = this.applySubGroupOrder(view.id, visibleSubGroups);

		const ids = orderedSubGroups.map((it: any) => it.id);
		const oldIndex = ids.indexOf(active.id);
		const newIndex = ids.indexOf(over.id);

		if (oldIndex !== -1 && newIndex !== -1) {
			const newOrder = arrayMove(ids, oldIndex, newIndex);
			Storage.setViewSubGroupOrder(view.id, newOrder);
			this.forceUpdate();
		};
	};

	resize () {
		const { rootId, block, isPopup, isInline } = this.props;
		const parent = S.Block.getParentLeaf(rootId, block.id);
		const node = $(this.node);
		const scroll = node.find('#scroll');
		const view = node.find('.viewContent');
		const container = U.Common.getPageContainer(isPopup);
		const cw = container.width();
		const size = J.Size.dataview.board;
		const groups = this.getGroups(false);
		const width = groups.length * (size.card + size.margin) - size.margin;

		if (!isInline) {
			const maxWidth = cw - PADDING * 2;
			const margin = width >= maxWidth ? PADDING : 0;

			scroll.css({ width: `calc(100% + ${PADDING * 2}px)`, marginLeft: -margin, paddingLeft: margin / 2 });

			if (width > maxWidth) {
				view.css({ width: width + size.margin });
			};
		} else 
		if (parent && (parent.isPage() || parent.isLayoutDiv())) {
			const wrapper = $('#editorWrapper');
			const ww = wrapper.width();
			const margin = (cw - ww) / 2;

			scroll.css({ width: cw, marginLeft: -margin, paddingLeft: margin });
			view.css({ width: width + margin + 2 });
		};
	};

});

export default ViewBoard;
