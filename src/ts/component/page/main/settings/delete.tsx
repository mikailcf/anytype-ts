import * as React from 'react';
import { observer } from 'mobx-react';

// Offline-only mode: account deletion is done by manually deleting the vault folder.
const PageMainSettingsDelete = observer(class PageMainSettingsDelete extends React.Component<{}, {}> {

	render () {
		return null;
	};

});

export default PageMainSettingsDelete;
