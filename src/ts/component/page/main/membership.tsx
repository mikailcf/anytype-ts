import React, { forwardRef, useRef, useState, useImperativeHandle, useEffect } from 'react';
import { observer } from 'mobx-react';
import { Loader, Frame, Title, Error, Button } from 'Component';
import { I, S, U, J, translate, analytics, sidebar } from 'Lib';

const PageMainMembership = observer(forwardRef<I.PageRef, I.PageComponent>((props, ref) => {

	const nodeRef = useRef(null);
	const { isPopup } = props;
	const [ error, setError ] = useState('');
	const { membership } = S.Auth;
	const { status } = membership;
	const tier = U.Data.getMembershipTier(membership.tier);

	const init = () => {
		// Membership features removed in offline-only mode - redirect to dashboard
		U.Space.openDashboardOrVoid({ replace: true });
		resize();
	};

	const resize = () => {
		const win = $(window);
		const node = $(nodeRef.current);
		const obj = U.Common.getPageFlexContainer(isPopup);

		node.css({ height: (isPopup ? obj.height() : win.height()) });
	};

	useEffect(() => init(), []);

	useImperativeHandle(ref, () => ({
		resize,
	}));

	return (
		<div 
			ref={nodeRef}
			className="wrapper"
		>
			<Frame>
				<Title text={error ? translate('commonError') : translate('pageMainMembershipTitle')} />
				<Error text={error} />

				{error ? (
					<div className="buttons">
						<Button 
							text={translate('commonBack')} 
							color="blank" 
							className="c36" 
							onClick={() => U.Space.openDashboardOrVoid()} 
						/>
					</div>
				) : <Loader />}
			</Frame>
		</div>
	);

}));

export default PageMainMembership;
