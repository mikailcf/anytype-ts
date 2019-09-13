import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { Frame, Title, Label, Error, Input, Button, HeaderAuth as Header, FooterAuth as Footer } from 'ts/component';

interface Props extends RouteComponentProps<any> {};
interface State {};

class PageAuthSelect extends React.Component<Props, State> {

	constructor (props: any) {
        super(props);

		this.onRegister = this.onRegister.bind(this);
		this.onLogin = this.onLogin.bind(this);
	};
	
	render () {
        return (
			<div>
				<div className="cover c3" />
				<Header />
				<Footer />
				
				<Frame>
					<Title text="Organize everything" />
					<Label text="With Anytype you can write notes and documents, manage tasks, share files and save important content from the web." />
								
					<div className="buttons">
						<Button text="Login" type="input" className="orange" onClick={this.onLogin} />
						<Button text="Sign up" type="input" className="grey" onClick={this.onRegister} />
					</div>
				</Frame>
			</div>
		);
    };

	onRegister (e: any) {
		e.preventDefault();
		
		this.props.history.push('/auth/code');
	};
	
	onLogin (e: any) {
		e.preventDefault();
		
		this.props.history.push('/auth/login');
	};
	
};

export default PageAuthSelect;