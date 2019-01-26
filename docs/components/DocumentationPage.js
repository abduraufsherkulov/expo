import Router, { withRouter } from 'next/router';
import { css } from 'react-emotion';

import * as React from 'react';
import * as Utilities from '~/common/utilities';
import * as Constants from '~/common/constants';
import * as WindowUtils from '~/common/window';
import { VERSIONS, LATEST_VERSION } from '~/common/versions';

import navigation from '~/common/navigation';

import DocumentationHeader from '~/components/DocumentationHeader';
import DocumentationFooter from '~/components/DocumentationFooter';
import DocumentationPageLayout from '~/components/DocumentationPageLayout';
import DocumentationSidebar from '~/components/DocumentationSidebar';
import DocumentationNestedScrollLayout from '~/components/DocumentationNestedScrollLayout';
import Head from '~/components/Head';
import { H1 } from '~/components/base/headings';

const STYLES_DOCUMENT = css`
  padding: 24px 24px 24px 32px;

  hr {
    border-top: 1px solid ${Constants.colors.border};
    border-bottom: 0px;
  }

  @media screen and (max-width: ${Constants.breakpoints.mobile}) {
    padding: 32px 16px 48px 16px;
  }
`;

const STYLES_ALERT = css`
  padding: 16px;
  border-radius: 4px;
  margin-bottom: 24px;
  line-height: 1.4;
  color: ${Constants.colors.white};
  background: ${Constants.colors.black};
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
`;

const STYLES_ALERT_BOLD = css`
  color: ${Constants.colors.white};
  font-family: ${Constants.fontFamilies.demi};
`;

const mutateRouteDataForRender = data => {
  data.forEach(element => {
    if (element.href) {
      element.as = Utilities.replaceVersionInUrl(element.href, 'latest');
    }

    if (element.posts) {
      mutateRouteDataForRender(element.posts);
    }
  });
};

export default withRouter(
  class DocumentationPage extends React.Component {
    state = {
      isMenuActive: false,
    };

    componentDidMount() {
      Router.onRouteChangeStart = () => {
        if (this.refs.layout) {
          window.__sidebarScroll = this.refs.layout.getSidebarScrollTop();
        }
        window.NProgress.start();
      };

      Router.onRouteChangeComplete = () => {
        window.NProgress.done();
      };

      Router.onRouteChangeError = () => {
        window.NProgress.done();
      };

      window.addEventListener('resize', this._handleResize);
    }

    componentWillUnmount() {
      window.removeEventListener('resize', this._handleResize);
    }

    _handleResize = () => {
      // NOTE(jim): Handles switching between web and mobile layouts.
      const scrollTop = document.body.scrollTop || document.documentElement.scrollTop;

      if (WindowUtils.getViewportSize().width >= Constants.breakpoints.mobileValue) {
        window.scrollTo(0, 0);
      }
    };

    _handleSetVersion = version => {
      this._version = version;
      let newPath = '/versions/' + version;

      // TODO: Find what's stripping trailing slashes from these
      if (version.startsWith('v')) {
        newPath += '/';
      }

      Router.push(newPath + '/');
    };

    _handleShowMenu = () => {
      this.setState({
        isMenuActive: true,
      });
    };

    _handleHideMenu = () => {
      this.setState({
        isMenuActive: false,
      });
    };

    render() {
      const sidebarScrollPosition = process.browser ? window.__sidebarScroll : 0;
      const { router } = this.props;
      const canonicalUrl = `https://docs.expo.io${Utilities.replaceVersionInUrl(
        router.pathname,
        'latest'
      )}`;

      let version = (router.asPath || router.pathname).split(`/`)[2];
      if (!version || VERSIONS.indexOf(version) === -1) {
        version = VERSIONS[0];
      }
      this._version = version;

      const routes = navigation[version];

      const headerElement = (
        <DocumentationHeader
          pathname={router.pathname}
          version={this._version}
          isMenuActive={this.state.isMenuActive}
          isAlogiaSearchHidden={this.state.isMenuActive}
          onSetVersion={this._handleSetVersion}
          onShowMenu={this._handleShowMenu}
          onHideMenu={this._handleHideMenu}
        />
      );

      const sidebarElement = (
        <DocumentationSidebar url={router.url} asPath={router.asPath} routes={routes} />
      );

      console.log(this.props.title);

      return (
        <DocumentationNestedScrollLayout
          ref="layout"
          header={headerElement}
          sidebar={sidebarElement}
          isMenuActive={this.state.isMenuActive}
          sidebarScrollPosition={sidebarScrollPosition}>
          <Head title={`${this.props.title} - Expo Documentation`}>
            {version === 'unversioned' && <meta name="robots" content="noindex" />}
            {version !== 'unversioned' && <link rel="canonical" href={canonicalUrl} />}
          </Head>

          {!this.state.isMenuActive ? (
            <div className={STYLES_DOCUMENT}>
              <div className={STYLES_ALERT}>
                <strong className={STYLES_ALERT_BOLD}>Hey friend!</strong> We are co-hosting a
                conference with <strong className={STYLES_ALERT_BOLD}>Software Mansion</strong>,{' '}
                <a
                  className={STYLES_ALERT_BOLD}
                  style={{ color: Constants.colors.lila }}
                  href="https://appjs.co/"
                  target="blank">
                  learn more
                </a>
                .
              </div>
              <H1>{this.props.title}</H1>
              {this.props.children}
              <DocumentationFooter />
            </div>
          ) : (
            <DocumentationSidebar url={router.url} asPath={router.asPath} routes={routes} />
          )}
        </DocumentationNestedScrollLayout>
      );
    }
  }
);
