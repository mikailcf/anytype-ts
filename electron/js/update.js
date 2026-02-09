class UpdateManager {

	win = null;
	isUpdating = false;
	autoUpdate = false;
	timeout = 0;

	setWindow (win) {};
	init () {};
	isAllowed () { return false; };
	setChannel (channel) {};
	checkUpdate (auto) {};
	download () {};
	relaunch () {};
	cancel () {};
	setTimeout () {};
	clearTimeout () {};

};

module.exports = new UpdateManager();
