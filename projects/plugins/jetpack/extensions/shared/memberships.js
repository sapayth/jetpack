/* global tb_show, tb_remove */

let premiumContentJWTTokenForCookie = '';

/**
 * @typedef globalThis
 * @param {globalThis.Event} eventFromIframe - message event that gets emitted in the checkout iframe.
 * @listens window#message
 */
export function handleIframeResult( eventFromIframe ) {
	if ( eventFromIframe.origin === 'https://subscribe.wordpress.com' && eventFromIframe.data ) {
		const data = JSON.parse( eventFromIframe.data );
		if ( data && data.result && data.result.jwt_token ) {
			// We save the token for now, doing nothing.
			premiumContentJWTTokenForCookie = data.result.jwt_token;
			setPurchaseResultCookie( premiumContentJWTTokenForCookie );
		}
		if ( data && data.action === 'close' && premiumContentJWTTokenForCookie ) {
			// The token was set during the purchase flow, we want to reload the whole page so the content is displayed
			window.location.reload();
		} else if ( data && data.action === 'close' ) {
			// User just aborted.
			window.removeEventListener( 'message', handleIframeResult );
			tb_remove && tb_remove();
		}
	}
}

function setUpThickbox( button ) {
	button.addEventListener( 'click', event => {
		event.preventDefault();
		const url = button.getAttribute( 'href' );
		window.scrollTo( 0, 0 );
		tb_show( null, url + '&display=alternate&TB_iframe=true', null );
		window.addEventListener( 'message', handleIframeResult, false );
		const tbWindow = document.querySelector( '#TB_window' );
		tbWindow.classList.add( 'jetpack-memberships-modal' );

		// This line has to come after the Thickbox has opened otherwise Firefox doesn't scroll to the top.
		window.scrollTo( 0, 0 );
	} );
}

export const initializeMembershipButtons = selector => {
	const membershipButtons = Array.prototype.slice.call( document.querySelectorAll( selector ) );
	membershipButtons.forEach( button => {
		if ( button.getAttribute( 'data-jetpack-memberships-button-initialized' ) === 'true' ) {
			return;
		}

		try {
			setUpThickbox( button );
		} catch ( err ) {
			// eslint-disable-next-line no-console
			console.error( 'Problem setting up Thickbox', err );
		}

		button.setAttribute( 'data-jetpack-memberships-button-initialized', 'true' );
	} );
};

const updateQueryStringParameter = function ( uri, key, value ) {
	const re = new RegExp( '([?&])' + key + '=.*?(&|$)', 'i' );
	const separator = uri.indexOf( '?' ) !== -1 ? '&' : '?';
	if ( uri.match( re ) ) {
		return uri.replace( re, '$1' + key + '=' + value + '$2' );
	}
	return uri + separator + key + '=' + value;
};

export const setPurchaseResultCookie = function ( premiumContentJWTToken ) {
	// We will set this in a cookie  - just in case. This will be reloaded in the refresh, when user clicks OK.
	// But user can close the browser window before clicking OK. IN that case, we want to leave a cookie behind.
	const date = new Date();
	date.setTime( date.getTime() + 365 * 24 * 60 * 60 * 1000 );
	document.cookie =
		'jp-premium-content-session' +
		'=' +
		premiumContentJWTToken +
		'; expires=' +
		date.toGMTString() +
		'; path=/';
};

export const reloadPageWithPremiumContentQueryString = function (
	premiumContentJWTToken,
	additionalParams
) {
	let newQueryString = updateQueryStringParameter(
		document.location.href,
		'token',
		premiumContentJWTToken
	);
	if ( additionalParams ) {
		Object.keys( additionalParams ).forEach( key => {
			newQueryString = updateQueryStringParameter( newQueryString, key, additionalParams[ key ] );
		} );
	}
	document.location.href = newQueryString;
};
