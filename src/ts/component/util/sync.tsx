import React, { forwardRef } from 'react';

interface Props {
	id?: string;
	className?: string;
	onClick: (e: any) => void;
};

const Sync = forwardRef<HTMLDivElement, Props>(() => {
	return null;
});

export default Sync;
