import * as React from 'react';
import { observer } from 'mobx-react';
import { Title, Label, Button, Icon } from 'Component';
import { I, translate, UtilCommon, UtilDate, UtilData } from 'Lib';
import { popupStore, authStore, commonStore } from 'Store';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Autoplay } from 'swiper/modules';
import Url from 'json/url.json';

const PopupSettingsPageMembership = observer(class PopupSettingsPageMembership extends React.Component<I.PopupSettings> {

	node: any = null;
	swiper: any = null;

	constructor (props: I.PopupSettings) {
		super(props);

		this.onSwiper = this.onSwiper.bind(this);
	};

	render () {
		const { membership, account } = authStore;
		const { membershipTiers } = commonStore;
		const url = Url.membershipSpecial.replace(/\%25accountId\%25/g, account.id);
		const links = [
			{ url: Url.pricing, name: translate('popupSettingsMembershipLevelsDetails') },
			{ url: Url.privacy, name: translate('popupSettingsMembershipPrivacyPolicy') },
			{ url: Url.terms, name: translate('popupSettingsMembershipTermsAndConditions') },
		];

		const SlideItem = (slide) => (
			<div className={[ 'slide', `c${slide.id}` ].join(' ')}>
				<div className="illustration" />
				<div className="text">
					<Title text={translate(`popupSettingsMembershipSlide${slide.id}Title`)} />
					<Label text={translate(`popupSettingsMembershipSlide${slide.id}Text`)} />
				</div>
			</div>
		);

		const TierItem = (props: any) => {
			const item = membershipTiers[props.idx];
			const isCurrent = item.id == membership.tier;
			const price = item.price ? `$${item.price}` : translate('popupSettingsMembershipJustEmail');

			let period = '';
			let buttonText = translate('popupSettingsMembershipLearnMore');

			if (isCurrent) {
				if (membership.status == I.MembershipStatus.Pending) {
					period = translate('popupSettingsMembershipPending');
				} else
				if (item.period && membership.dateEnds) {
					period = UtilCommon.sprintf(translate('popupSettingsMembershipValidUntil'), UtilDate.date('d M Y', membership.dateEnds))
				} else {
					period = translate('popupSettingsMembershipForeverFree');
				};

				buttonText = translate('popupSettingsMembershipManage');
			} else 
			if (item.period) {
				period = item.period == I.MembershipPeriod.Period1Year ? 
					translate('popupSettingsMembershipPerYear') : 
					UtilCommon.sprintf(translate('popupSettingsMembershipPerYears'), item.period);
			};

			return (
				<div 
					className={[ 'tier', `c${item.id}`, item.color, (isCurrent ? 'isCurrent' : '') ].join(' ')}
					onClick={() => popupStore.open('membership', { data: { tier: item.id } })}
				>
					<div className="top">
						<div className="iconWrapper">
							<Icon />
							<div className="current">{translate('popupSettingsMembershipCurrent')}</div>
						</div>

						<Title text={item.name} />
						<Label text={item.description} />
					</div>
					<div className="bottom">
						<div className="priceWrapper">
							<span className="price">{price}</span>{period}
						</div>
						<Button className="c28" text={buttonText} />
					</div>
				</div>
			);
		};

		return (
			<div ref={node => this.node = node}>
				<div className="membershipTitle">{!membership.isNone ? translate('popupSettingsMembershipTitle1') : translate('popupSettingsMembershipTitle2')}</div>

				{!membership.isNone ? '' : (
					<React.Fragment>
						<Label className="description" text={translate('popupSettingsMembershipText')} />

						<Swiper
							spaceBetween={16}
							slidesPerView={1.15}
							pagination={{ clickable: true }}
							autoplay={{
								waitForTransition: true,
								delay: 4000,
								disableOnInteraction: true,
							}}
							modules={[ Pagination, Autoplay ]}
							centeredSlides={true}
							loop={true}
							onSwiper={this.onSwiper}
						>
							{Array(4).fill(null).map((item: any, i: number) => (
								<SwiperSlide key={i}>
									<SlideItem key={i} id={i} />
								</SwiperSlide>
							))}
						</Swiper>
					</React.Fragment>
				)}

				<div className="tiers">
					{membershipTiers.map((tier, i) => (
						<TierItem key={i} idx={i} />
					))}
				</div>

				<div className="actionItems">
					{links.map((item, i) => (
						<div key={i} onClick={() => UtilCommon.onUrl(item.url)} className="item">
							<Label text={item.name} />
							<Icon />
						</div>
					))}
				</div>

				<Label className="special" text={UtilCommon.sprintf(translate('popupSettingsMembershipSpecial'), url)} />
			</div>
		);
	};

	componentDidMount(): void {
		UtilCommon.renderLinks($(this.node));
	};

	onSwiper (swiper) {
		this.swiper = swiper;
	};

});

export default PopupSettingsPageMembership;
