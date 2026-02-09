import React, { forwardRef } from 'react';
import { observer } from 'mobx-react';

interface Props {
	components: string[];
	route: string;
	className?: string;
};

// Offline-only mode: membership upsell banners are disabled
const UpsellBanner = observer(forwardRef<{}, Props>(() => {
	return null;
}));

export default UpsellBanner;
