import React, { forwardRef } from 'react';
import { observer } from 'mobx-react';
import { I } from 'Lib';

// Stub: Membership functionality removed in offline-only mode
const PopupMembershipPageSuccess = observer(forwardRef<{}, I.Popup>((props, ref) => {
	return null;
}));

export default PopupMembershipPageSuccess;
