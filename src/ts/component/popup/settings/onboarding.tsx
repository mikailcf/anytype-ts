import React, { forwardRef, useState } from 'react';
import { Title, Label, Button, Error } from 'Component';
import { I, S, U, translate, Action, analytics, Renderer, Preview } from 'Lib';
import { observer } from 'mobx-react';

const PopupSettingsOnboarding = observer(forwardRef<{}, I.Popup>((props, ref) => {

	const { close } = props;
	const userPath = U.Common.getElectron().userPath();
	const [ config, setConfig ] = useState({
		userPath,
	});
	const [ error, setError ] = useState('');

	const onChange = (key: string, value: any) => {
		setConfig(prev => ({ ...prev, [ key ]: value }));
	};

	const onPathClick = (path: string) => {
		if (path) {
			Action.openPath(U.Common.getElectron().dirName(path));
		};
	};

	const onConfirmStorage = (onConfirm: () => void) => {
		S.Popup.open('confirm', {
			data: {
				title: translate('commonAreYouSure'),
				text: translate('popupSettingsOnboardingLocalOnlyWarningText'),
				textConfirm: translate('popupSettingsOnboardingLocalOnlyWarningConfirm'),
				onConfirm,
			},
		});
	};

	const onChangeStorage = () => {
		const onConfirm = () => {
			Action.openDirectoryDialog({}, (paths: string[]) => {
				onChange('userPath', paths[0]);

				analytics.event('ChangeStorageLocation', { type: 'Change', route: analytics.route.onboarding });
			});
		};

		// Offline-only mode: always show confirmation since data is local-only
		onConfirmStorage(onConfirm);
	};

	const onResetStorage = () => {
		const onConfirm = () => {
			onChange('userPath', U.Common.getElectron().defaultPath());

			analytics.event('ChangeStorageLocation', { type: 'Reset', route: analytics.route.onboarding });
		};

		// Offline-only mode: always show confirmation since data is local-only
		onConfirmStorage(onConfirm);
	};

	const onSave = () => {
		const currentUserPath = U.Common.getElectron().userPath();

		if (config.userPath !== currentUserPath) {
			Renderer.send('setUserDataPath', config.userPath);
			S.Common.dataPathSet(config.userPath);
		};

		window.setTimeout(() => close(), S.Popup.getTimeout());
	};

	const onTooltipShow = (e: any, text: string) => {
		if (text) {
			Preview.tooltipShow({ text, element: $(e.currentTarget) });
		};
	};

	const onTooltipHide = () => {
		Preview.tooltipHide();
	};

	const isDefault = config.userPath == U.Common.getElectron().defaultPath();

	return (
		<div className="mainSides">
			<div id="sideRight" className="side right tabOnboarding">
				<Title text={translate('popupSettingsPersonalTitle')} />

				<div className="actionItems">
					<div className="item" onMouseEnter={e => onTooltipShow(e, config.userPath)} onMouseLeave={onTooltipHide}>
						<div onClick={() => onPathClick(config.userPath)}>
							<Label text={translate('popupSettingsOnboardingStoragePath')} />
							<Label className="small" text={U.Common.shorten(config.userPath, 32)} />
						</div>
						<div className="buttons">
							<Button className="c28" text={translate('commonChange')} onClick={onChangeStorage} />
							{!isDefault ? <Button className="c28" text={translate('commonReset')} onClick={onResetStorage} /> : ''}
						</div>
					</div>
				</div>

				<div className="buttons">
					<Button text={translate('commonSave')} onClick={onSave} />
				</div>

				<Error text={error} />
			</div>
		</div>
	);

}));

export default PopupSettingsOnboarding;
