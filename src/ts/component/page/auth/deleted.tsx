import React, { forwardRef, useEffect } from 'react';
import { observer } from 'mobx-react';
import { Frame, Title, Label, Button } from 'Component';
import { I, S, U, translate } from 'Lib';

// Offline-only mode: account deletion is done by manually deleting the vault folder.
// This page just offers logout since there's no cloud account to delete/revert.
const PageAuthDeleted = observer(forwardRef<{}, I.PageComponent>(() => {

	const onLogout = () => {
		U.Router.go('/', {
			replace: true,
			animate: true,
			onFadeIn: () => {
				S.Auth.logout(true, false);
			},
		});
	};

	return (
		<Frame>
			<Title className="animation" text={translate('commonError')} />
			<Label className="animation" text={translate('authDeleteDescriptionDeleted')} />
			<div className="animation buttons">
				<Button color="blank" text={translate('commonLogout')} onClick={onLogout} />
			</div>
		</Frame>
	);

}));

export default PageAuthDeleted;
