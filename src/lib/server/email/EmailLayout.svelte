<script lang="ts" context="module">
	export const COLOR_PRIMARY = '#0072c6';
	export const COLOR_PRIMARY_DARK = '#004b83';
	export const COLOR_PRIMARY_DARKER = '#002e4f';
	export const COLOR_GRAY = 'rgb(114, 114, 114)';
	export const COLOR_TEXT = 'rgb(10, 10, 10)';
	export const COLOR_LIGHT_GRAY = 'rgb(226, 226, 226)';
	export const COLOR_BACKGROUND = 'rgb(252, 252, 252)';

	export const A_STYLE_TOPBAR = `
		color: ${COLOR_BACKGROUND};
		text-decoration: none;
	`;

	export const A_STYLE_NORMAL = `
		color: ${COLOR_PRIMARY};
		text-decoration: none;
	`;

	export const A_STYLE_BUTTON = `
		background-color: ${COLOR_PRIMARY};
		text-decoration: none;
		color: white;
		border: none;
		margin: 0;
		padding: 10px 15px;
		font-weight: 600;
		cursor: pointer;
		border-radius: 3px;
		border: transparent solid 1px;
		font-size: inherit;
		font-family: inherit;
	`;
</script>

<script lang="ts">
	import { getContext } from 'svelte';
	import { EmailConfig } from './config';
	const APP_NAME = EmailConfig.APP_NAME;
	const ORIGIN = EmailConfig.ORIGIN;

	const subject = getContext('subject');
</script>

{@html '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">'}
<html lang="en" style="margin: 0; padding: 0;">
	<head>
		{@html '<meta httpEquiv="Content-Type" content="text/html; charset=UTF-8" />'}
		<style>
			a.button:hover {
				background-color: #004b83;
				color: white;
			}

			a.button:hover:active {
				background-color: #002e4f;
				color: white;
			}
		</style>
	</head>
	<body
		style={"font-family: 'Segoe UI', 'Segoe UI Web (West European)', -apple-system, BlinkMacSystemFont, Roboto, 'Helvetica Neue', sans-serif; " +
			'font-size: 18px; ' +
			'line-height: 1.5; ' +
			`color: ${COLOR_TEXT}; ` +
			`background-color: #fff; ` +
			'padding: 14px; ' +
			'margin: 0 auto;' +
			'max-width: 800px;'}
	>
		<div id="preview" style="display: none; overflow: hidden; font-size: 1px; opacity: 0;">
			<slot name="preview" />
			<br />
			{'\xa0\u200C\u200B\u200D\u200E\u200F\uFEFF'.repeat(50)}
		</div>
		<div
			style={`background-color: ${COLOR_PRIMARY}; color: ${COLOR_BACKGROUND}; width: 100%; padding: 5px 10px; margin: 0;`}
		>
			<td>
				<a href="https://maowtm.org" target="_blank" style={A_STYLE_TOPBAR}> mw </a>
				/
				<a href={ORIGIN} style={`font-weight: bold; ${A_STYLE_TOPBAR}`}>
					{APP_NAME}
				</a>
			</td>
		</div>
		<div style="padding: 30px;">
			<h1
				style={`padding: 0; margin: 10px 0; font-size: 28px; font-weight: bold; line-height: 1.5;`}
			>
				{subject}
			</h1>
			<slot />
		</div>
		<div
			style={`margin: 0; padding: 20px; background-color: ${COLOR_LIGHT_GRAY}; font-size: 12px;`}
		>
			<slot name="footer" />
			<p>
				{APP_NAME} is an independent project created by
				<a href="mailto:m@maowtm.org" style={A_STYLE_NORMAL}>Tingmao Wang</a>. It is not affiliated
				with any other organization, including but not limited to my employer. You data is handled
				in accordance with the
				<a href={`${ORIGIN}/privacy`} target="_blank" style={A_STYLE_NORMAL}
					>{APP_NAME} Privacy Policy</a
				>.
			</p>
		</div>
	</body>
</html>
