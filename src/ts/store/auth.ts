import { observable, action, computed, set, makeObservable } from 'mobx';
import { I, M, C, S, U, Storage, analytics, Renderer, keyboard } from 'Lib';

interface NetworkConfig {
	mode: I.NetworkMode;
	path: string;
};

class AuthStore {
	
	public accountItem: I.Account = null;
	public accountList: I.Account[] = [];
	public token = '';
	public appToken = '';
	public appKey = '';
	public startingId: Map<string, string> = new Map();
	public membershipData: I.Membership = { tier: I.TierType.None, status: I.MembershipStatus.Unknown };
	
	constructor () {
		makeObservable(this, {
			accountItem: observable,
			accountList: observable,
			membershipData: observable,
			membership: computed,
			accounts: computed,
			account: computed,
			accountAdd: action,
			accountSet: action,
			membershipSet: action,
			clearAll: action,
			logout: action,
		});
	};

	get accounts (): I.Account[] {
		return this.accountList;
	};

	get account (): I.Account {
		return this.accountItem;
	};

	get accountSpaceId (): string {
		return String(this.accountItem?.info?.accountSpaceId || '');
	};

	get networkConfig (): NetworkConfig {
		// Offline-only mode: always use Local network mode
		return {
			mode: I.NetworkMode.Local,
			path: '',
		};
	};

	get membership (): I.Membership {
		return this.membershipData || { tier: I.TierType.None, status: I.MembershipStatus.Unknown };
	};

	/**
	 * Sets the authentication token.
	 * @param {string} v - The token value.
	 */
	tokenSet (v: string) {
		this.token = String(v || '');
		Renderer.send('setToken', this.token);
	};

	/**
	 * Sets the app token.
	 * @param {string} v - The app token value.
	 */
	appTokenSet (v: string) {
		this.appToken = String(v || '');
	};

	/**
	 * Sets the network configuration.
	 * No-op in offline-only mode - network config is always Local.
	 * @param {NetworkConfig} obj - The network configuration object (ignored).
	 */
	networkConfigSet (obj: NetworkConfig) {
		// No-op: offline-only mode always uses Local network
	};

	/**
	 * Sets the app key.
	 * @param {string} v - The app key value.
	 */
	appKeySet (v: string) {
		this.appKey = String(v || '');
	};

	/**
	 * Sets the membership data.
	 * No-op in offline-only mode - membership is disabled.
	 * @param {I.Membership} v - The membership data (ignored).
	 */
	membershipSet (v: I.Membership) {
		// No-op: offline-only mode has no membership
	};

	/**
	 * Updates the membership data.
	 * No-op in offline-only mode - membership is disabled.
	 * @param {I.Membership} v - The membership data (ignored).
	 */
	membershipUpdate (v: I.Membership) {
		// No-op: offline-only mode has no membership
	};

	/**
	 * Updates the sync status for a space.
	 * No-op in offline-only mode - sync status is not tracked.
	 */
	syncStatusUpdate (_v: I.SyncStatus) {
		// No-op: offline-only mode has no sync
	};

	/**
	 * Adds an account to the account list.
	 * @param {any} account - The account object.
	 */
	accountAdd (account: any) {
		account.info = account.info || {};
		account.status = account.status || {};
		account.config = account.config || {};

		this.accountList.push(new M.Account(account));
	};

	/**
	 * Clears the account list.
	 * @private
	 */
	accountListClear () {
		this.accountList = [];
	};

	/**
	 * Sets the current account.
	 * @param {any} account - The account object.
	 */
	accountSet (account: any) {
		account = account || {};
		account.info = account.info || {};
		account.status = account.status || {};
		account.config = account.config || {};

		if (!this.accountItem) {
			this.accountItem = new M.Account(account);
		} else {
			set(this.accountItem, account);
		};

		if (account.id) {
			Storage.set('accountId', account.id);
		};
	};

	/**
	 * Sets the status of the current account.
	 * @param {I.AccountStatus} status - The account status.
	 */
	accountSetStatus (status: I.AccountStatus) {
		if (this.accountItem) {
			set(this.accountItem.status, status);
		};
	};

	/**
	 * Checks if the current account is deleted.
	 * @returns {boolean} True if deleted, false otherwise.
	 */
	accountIsDeleted (): boolean {
		return this.accountItem && this.accountItem.status && [ 
			I.AccountStatusType.StartedDeletion,
			I.AccountStatusType.Deleted,
		].includes(this.accountItem.status.type);
	};

	/**
	 * Checks if the current account is pending deletion.
	 * @returns {boolean} True if pending, false otherwise.
	 */
	accountIsPending (): boolean {
		return this.accountItem && this.accountItem.status && [ 
			I.AccountStatusType.PendingDeletion,
		].includes(this.accountItem.status.type);
	};

	/**
	 * Gets the sync status for a space.
	 * Returns default offline status in offline-only mode.
	 */
	getSyncStatus (_spaceId?: string): I.SyncStatus {
		return {
			id: '',
			error: I.SyncStatusError.None,
			network: I.SyncStatusNetwork.Anytype,
			status: I.SyncStatusSpace.Offline,
			p2p: I.P2PStatus.NotConnected,
			syncingCounter: 0,
			devicesCounter: 0,
			notSyncedCounter: 0,
		};
	};

	/**
	 * Gets the number of not synced files.
	 * Always returns zero in offline-only mode.
	 */
	getNotSynced (): I.NotSyncedFiles {
		return { total: 0, files: [] };
	};

	/**
	 * Clears all authentication and account data.
	 */
	clearAll () {
		this.accountItem = null;

		this.accountListClear();
	};

	/**
	 * Logs out the current account.
	 * @param {boolean} mainWindow - Whether this is the main window.
	 * @param {boolean} removeData - Whether to remove data.
	 */
	logout (mainWindow: boolean, removeData: boolean) {
		U.Subscription.destroyAll(() => {
			if (mainWindow) {
				if (S.Auth.token) {
					C.AccountStop(removeData, () => U.Data.closeSession());
				};
				Renderer.send('logout');
			} else {
				U.Data.closeSession();
			};

			analytics.profile('', '');
			analytics.removeContext();

			keyboard.setPinChecked(false);

			S.Common.spaceSet('');

			S.Block.clearAll();
			S.Detail.clearAll();
			S.Record.clearAll();
			S.Menu.closeAllForced();
			S.Notification.clear();
			S.Chat.clearAll();

			this.clearAll();
			Storage.logout();

			Renderer.send('setBadge', '');
		});
	};

};

export const Auth: AuthStore = new AuthStore();
