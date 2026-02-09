
import React, { forwardRef } from 'react';
import { I } from 'Lib';

interface Props extends I.SidebarPageComponent {
	id: string;
	name: string;
	style: any;
};

const SidebarPageVaultUpdate = forwardRef<{}, Props>((props, ref) => {
	return null;
});

export default SidebarPageVaultUpdate;
