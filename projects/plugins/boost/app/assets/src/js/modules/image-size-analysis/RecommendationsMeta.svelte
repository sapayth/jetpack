<script lang="ts">
	import { __, sprintf } from '@wordpress/i18n';
	import Button from '../../elements/Button.svelte';
	import ErrorNotice from '../../elements/ErrorNotice.svelte';
	import ImageCDNRecommendation from '../../elements/ImageCDNRecommendation.svelte';
	import RefreshIcon from '../../svg/refresh.svg';
	import WarningIcon from '../../svg/warning-outline.svg';
	import { recordBoostEvent, recordBoostEventAndRedirect } from '../../utils/analytics';
	import getIsaErrorSuggestion from '../../utils/get-isa-error-suggestion';
	import MultiProgress from './MultiProgress.svelte';
	import { resetIsaQuery } from './store/isa-data';
	import {
		requestImageAnalysis,
		ISAStatus,
		getSummaryProgress,
		type ISASummaryGroup,
		type ISASummary,
	} from './store/isa-summary';

	export let isCdnActive: boolean;
	export let isaSummary: ISASummary | null;

	function scannedPagesCount( isaGroups: Record< string, ISASummaryGroup > ) {
		return Object.values( isaGroups )
			.map( group => group.scanned_pages )
			.reduce( ( a, b ) => a + b, 0 );
	}

	let submitError: undefined | string;
	let requestingReport = false;
	let errorCode: undefined | number;

	$: status = isaSummary?.status;
	$: groups = isaSummary?.groups || {};
	$: scannedPages = scannedPagesCount( groups );

	/**
	 * Calculate total number of issues.
	 */
	$: totalIssues = groups
		? Object.values( groups ).reduce( ( total, group ) => total + group.issue_count, 0 )
		: 0;

	/**
	 * Work out if there is an error to show in the UI.
	 */
	$: errorMessage =
		submitError ||
		( status === ISAStatus.Stuck &&
			__(
				'Your Image Size Analysis task seems to have gotten stuck, or our system is under unusual load. Please try again. If the issue persists, please contact support.',
				'jetpack-boost'
			) );

	/**
	 * Update suggestion based on error code.
	 */
	$: errorSuggestion = getIsaErrorSuggestion( errorCode );

	/**
	 * Work out whether we have a 'give us a minute' notice to show.
	 */
	$: waitNotice =
		( requestingReport && __( 'Getting ready…', 'jetpack-boost' ) ) ||
		( status === ISAStatus.New && __( 'Warming up the engine…', 'jetpack-boost' ) ) ||
		( status === ISAStatus.Queued &&
			__( 'Give us a few minutes while we go through your images…', 'jetpack-boost' ) );

	/**
	 * Start a new image analysis job.
	 */
	async function startAnalysis() {
		try {
			errorCode = undefined;
			errorMessage = undefined;
			requestingReport = true;
			await requestImageAnalysis();
			resetIsaQuery();
		} catch ( err ) {
			errorCode = err.body?.code;
			errorMessage = err.message;
		} finally {
			requestingReport = false;
		}
	}

	function handleAnalyzeClick() {
		const eventName =
			status === ISAStatus.Completed
				? 'clicked_restart_isa_on_summary_page'
				: 'clicked_start_isa_on_summary_page';
		recordBoostEvent( eventName, {} );
		return startAnalysis();
	}

	/**
	 * Work out whether to recommend the Image CDN. It should show if the CDN is off and no report has been run, or a report has found issues.
	 */
	$: showCDNRecommendation = ! isCdnActive && ( totalIssues > 0 || status === ISAStatus.NotFound );
</script>

{#if ! groups}
	<div class="summary">
		{__( 'Loading…', 'jetpack-boost' )}
	</div>
{:else}
	<!-- Show error messages or "please wait" messages. -->
	{#if errorMessage}
		<div class="error-area">
			<ErrorNotice
				title={__( 'Something has gone wrong.', 'jetpack-boost' )}
				suggestion={errorSuggestion}
			>
				{errorMessage}
			</ErrorNotice>
		</div>
	{:else if waitNotice}
		<div class="summary-line wait-notice">
			{waitNotice}
		</div>
	{/if}

	<!-- Show a summary line if the report is completed. -->
	{#if ! requestingReport && status === ISAStatus.Completed}
		<div class="summary-line">
			{#if totalIssues > 0}
				<div class="has-issues summary">
					<WarningIcon class="icon" />
					{sprintf(
						// translators: 1: Number of scanned issues found 2: Number of scanned pages
						__(
							'Found a total of %1$d issues after scanning your %2$d most recent pages.',
							'jetpack-boost'
						),
						totalIssues,
						scannedPages
					)}
				</div>
			{:else}
				<div class="summary">
					{sprintf(
						// translators: %d: Number of pages scanned
						__(
							'Congratulations; no issues found after scanning your %d most recent pages.',
							'jetpack-boost'
						),
						scannedPages
					)}
				</div>
			{/if}

			<button
				type="button"
				class="components-button is-link"
				on:click={handleAnalyzeClick}
				disabled={requestingReport}
			>
				<RefreshIcon />
				{__( 'Analyze again', 'jetpack-boost' )}
			</button>
		</div>
	{/if}

	<!-- Show progress if a job is rolling. -->
	{#if ! requestingReport && [ ISAStatus.Completed, ISAStatus.Queued ].includes( status )}
		<MultiProgress summaryProgress={getSummaryProgress( groups )} />
	{/if}

	<!-- Show recommendation to enable Image CDN if it was inactive and issues have been found -->
	{#if showCDNRecommendation}
		<div class="jb-notice">
			<div class="jb-notice__content">
				<ImageCDNRecommendation />
			</div>
		</div>
	{/if}

	<!-- Show a button to view the report if it's in progress or completed. -->
	{#if [ ISAStatus.Queued, ISAStatus.Completed ].includes( status ) && ! requestingReport}
		<div class="button-area">
			<Button
				disabled={requestingReport}
				on:click={() =>
					recordBoostEventAndRedirect(
						'#image-size-analysis/all/1',
						'clicked_view_isa_report_on_summary_page',
						{}
					)}
			>
				{status === ISAStatus.Completed
					? __( 'See full report', 'jetpack-boost' )
					: __( 'View report in progress', 'jetpack-boost' )}
			</Button>
		</div>
	{/if}

	<!-- Show a button to kick off a report -->
	{#if ! [ ISAStatus.New, ISAStatus.Queued, ISAStatus.Completed ].includes( status )}
		<div class="button-area">
			<Button disabled={requestingReport} on:click={handleAnalyzeClick}>
				{status === ISAStatus.Completed
					? __( 'Analyze again', 'jetpack-boost' )
					: __( 'Start image analysis', 'jetpack-boost' )}
			</Button>
		</div>
	{/if}
{/if}

<style lang="scss">
	@use '../../../css/main/variables.scss' as *;

	.summary-line {
		font-size: 14px;
		line-height: 22px;
		display: flex;
		flex-direction: row;
		align-items: flex-start;
		margin-bottom: 17px;

		@media ( max-width: 600px ) {
			flex-direction: column;
		}
	}

	.summary-line button {
		:global( svg ) {
			margin: 4px 4px 2px 0;
			fill: $jetpack-green;
		}

		@media ( max-width: 600px ) {
			margin-top: 15px;
		}
	}

	.summary {
		margin-right: 5px;
		flex-grow: 1;
		position: relative;
		color: $jetpack-green;
	}

	.has-issues {
		color: var( --jp-orange-20 );
	}

	.has-issues :global( svg ) {
		width: 22px;
		height: 22px;
		top: 4px;
		position: relative;
	}

	.wait-notice {
		color: var( --wp-admin-theme-color );
	}

	.error-area {
		margin-top: 16px;
		margin-bottom: 16px;
	}

	.button-area {
		margin-top: 32px;
	}

	.jb-notice {
		width: 100%;
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 16px 24px;
		margin: 32px 0;
		border: 2px solid $jetpack-green;
		border-radius: $border-radius;
		background-color: #ffffff;
		text-align: left;
	}
</style>
