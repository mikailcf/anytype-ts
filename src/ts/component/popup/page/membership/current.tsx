import React, { forwardRef } from 'react';
import { observer } from 'mobx-react';
import { I } from 'Lib';

interface Props extends I.Popup {
	onChangeEmail: () => void;
};

// Stub: Membership functionality removed in offline-only mode
const PopupMembershipPageCurrent = observer(forwardRef<{}, Props>((props, ref) => {
	return null;
}));

export default PopupMembershipPageCurrent;
