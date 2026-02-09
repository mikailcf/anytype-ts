import { I } from 'Lib';

class Analytics {

	contextId: string = '';
	stack: any[] = [];

	public route = {
		app: 'App',
		block: 'Block',
		onboarding: 'Onboarding',
		collection: 'Collection',
		set: 'Set',
		gallery: 'Gallery',
		settings: 'Settings',
		featured: 'FeaturedRelations',
		notification: 'Notification',
		deleted: 'Deleted',
		banner: 'Banner',
		widget: 'Widget',
		addWidget: 'AddWidget',
		inWidget: 'InWidget',
		graph: 'Graph',
		store: 'Library',
		type: 'Type',
		bookmark: 'Bookmark',
		webclipper: 'Webclipper',
		clipboard: 'Clipboard',
		shortcut: 'Shortcut',
		turn: 'TurnInto',
		powertool: 'Powertool',
		syncStatus: 'SyncStatus',
		search: 'Search',
		relation: 'Relation',
		link: 'Link',
		mention: 'Mention',
		media: 'Media',
		calendar: 'Calendar',
		vault: 'Vault',
		void: 'Void',
		chat: 'Chat',
		archive: 'Bin',
		toast: 'Toast',
		share: 'Share',
		navigation: 'Navigation',
		object: 'Object',
		library: 'Library',
		header: 'Header',

		screenDate: 'ScreenDate',
		screenRelation: 'ScreenRelation',
		screenType: 'ScreenType',

		menuOnboarding: 'MenuOnboarding',
		menuObject: 'MenuObject',
		menuSystem: 'MenuSystem',
		menuHelp: 'MenuHelp',
		menuContext: 'MenuContext',
		menuAction: 'MenuAction',
		menuAdd: 'MenuAdd',
		menuPublish: 'MenuPublish',

		migrationOffer: 'MigrationImportBackupOffer',
		migrationImport: 'MigrationImportBackupOffer',

		settingsSpace: 'SettingsSpace',
		settingsSpaceIndex: 'ScreenSettingsSpaceIndex',
		settingsSpaceShare: 'ScreenSettingsSpaceShare',
		settingsMembership: 'ScreenSettingsMembership',
		settingsStorage: 'ScreenSettingsSpaceStorage',

		inviteLink: 'InviteLink',
		inviteConfirm: 'ScreenInviteConfirm',

		addWidgetMain: 'Main',
		addWidgetEditor: 'Editor',
		addWidgetMenu: 'Menu',
		addWidgetDnD: 'DnD',

		usecaseApp: 'App',
		usecaseSite: 'Site',

		onboardingTooltip: 'OnboardingTooltip',

		message: 'Message',
		reaction: 'Reaction',
		icon: 'Icon',
		editor: 'Editor',
	};

	debug () {
		return false;
	};

	isAllowed (): boolean {
		return false;
	};

	init (_options?: any) {};

	setVersion () {};

	profile (_id: string, _networkId: string) {};

	setContext (_context: string) {};

	removeContext () {};

	setTier (_tier: I.TierType) {};

	setProperty (_props: any) {};

	event (_code: string, _data?: any) {};

	createObject (_objectType: string, _layout: I.ObjectLayout, _route: string, _time: number) {};

	createWidget (_layout: I.WidgetLayout, _route: string) {};

	changeRelationValue (_relation: any, _value: any, _param: any) {};

	typeMapper (_id: string): string {
		return '';
	};

	embedType (isInline: boolean): string {
		return isInline ? 'inline' : 'object';
	};

	networkType (v: any): string {
		v = Number(v) || 0;

		switch (v) {
			case I.NetworkMode.Default: return 'Anytype';
			case I.NetworkMode.Local: return 'LocalOnly';
			case I.NetworkMode.Custom: return 'SelfHost';
		};
		return '';
	};

	stackAdd (_code: string, _data?: any) {};

	stackSend () {};

	log (..._args: any[]) {};

};

 export const analytics: Analytics = new Analytics();
