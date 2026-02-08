import React, { forwardRef, useEffect } from 'react';
import { I, U } from 'Lib';

const PageMainInvite = forwardRef<{}, I.PageComponent>((props, ref) => {

	useEffect(() => {
		U.Space.openDashboardOrVoid();
	}, []);

	return null;
});

export default PageMainInvite;
