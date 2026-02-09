import * as React from 'react';
import { Title, Label, Button, Icon } from 'Component';
import { I, C, S, U, translate, analytics, Action } from 'Lib';
import { observer } from 'mobx-react';

interface Props extends I.PageSettingsComponent {
	onPage: (id: string) => void;
	setLoading: (v: boolean) => void;
};

const PageMainSettingsDataIndex = observer(class PageMainSettingsDataIndex extends React.Component<Props, {}> {

	constructor (props: Props) {
		super(props);

		this.onOffload = this.onOffload.bind(this);
	};

	render () {
		const { dataPath, spaceStorage } = S.Common;
		const { localUsage } = spaceStorage;
		const suffix = this.getSuffix();

		return (
			<>
				<Title text={translate('popupSettingsLocalStorageTitle')} />
				<Label className="description" text={translate(`popupSettingsDataManagementLocalStorageText${suffix}`)} />

				<div className="actionItems">

					<div className="item storageUsage">
						<div className="side left">
							<Icon className="drive" />

							<div className="txt">
								<div className="name">{translate('popupSettingsDataLocalFiles')}</div>
								<div className="type">{U.Common.sprintf(translate(`popupSettingsDataManagementLocalStorageUsage`), U.File.size(localUsage))}</div>
							</div>
						</div>
						<div className="side right">
							<Button color="blank" className="c28" text={translate(`popupSettingsDataManagementOffloadFiles${suffix}`)} onClick={this.onOffload} />
						</div>
					</div>

					<div className="item">
						<div className="side left">
							<Icon className="location" />

							<div className="txt">
								<Title text={translate('popupSettingsDataManagementDataLocation')} />
								<Label text={dataPath} />
							</div>
						</div>
						<div className="side right">
							<Button color="blank" className="c28" text={translate(`commonOpen`)} onClick={this.onOpenDataLocation} />
						</div>
					</div>
				</div>
			</>
		);
	};

	componentDidMount(): void {
		// Publishing disabled in offline-only mode
	};

	onOffload (e: any) {
		const { setLoading } = this.props;
		const suffix = this.getSuffix();
		analytics.event('ScreenFileOffloadWarning');

		S.Popup.open('confirm',{
			data: {
				title: translate('commonAreYouSure'),
				text: translate(`popupSettingsDataOffloadWarningText${suffix}`),
				textConfirm: translate('popupSettingsDataRemoveFiles'),
				textCancel: translate('popupSettingsDataKeepFiles'),
				onConfirm: () => {
					setLoading(true);
					analytics.event('SettingsStorageOffload');

					C.FileListOffload([], false, (message: any) => {
						setLoading(false);

						if (message.error.code) {
							return;
						};

						S.Popup.open('confirm',{
							data: {
								title: translate('popupSettingsDataFilesOffloaded'),
								textConfirm: translate('commonOk'),
								canCancel: false,
							}
						});

						analytics.event('FileOffload', { middleTime: message.middleTime });
					});
				},
			},
		});
	};

	onOpenDataLocation () {
		Action.openPath(S.Common.dataPath);
		analytics.event('ClickSettingsDataManagementLocation', { route: analytics.route.settings });
	};

	getSuffix () {
		return 'LocalOnly';
	};

});

export default PageMainSettingsDataIndex;
