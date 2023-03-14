import { trackKindOptionProps } from '../../../lib/video-tracks/types';

export type VideoId = number;
export type VideoGUID = string;

export type TrackProps = {
	label: string;
	srcLang: string;
	kind: trackKindOptionProps;
	src: string;
};

export type VideoBlockColorAttributesProps = {
	seekbarPlayedColor?: string;
	seekbarLoadingColor?: string;
	seekbarColor?: string;
};

type BlockSupportAlignProp = 'left' | 'center' | 'right' | 'wide' | 'full' | undefined;

export type VideoBlockAttributes = VideoBlockColorAttributesProps & {
	id?: VideoId;
	guid?: VideoGUID;
	src?: string;

	align?: BlockSupportAlignProp;
	title?: string;
	description?: string;

	poster?: string;
	videoRatio?: number;
	tracks?: Array< TrackProps >;

	// Playback types
	autoplay?: boolean;
	caption?: string;
	controls?: boolean;
	loop?: boolean;
	muted?: boolean;
	playsinline?: boolean;
	preload?: string;

	// Rendering types
	cacheHtml?: string;
	maxWidth?: string;

	useAverageColor?: boolean;

	// Privacy and Rating types
	privacySetting?: number;
	allowDownload?: boolean;
	displayEmbed?: boolean;
	rating?: string;

	isPrivate?: boolean;

	// CSS classes
	className?: string;
};

export type CoreEmbedBlockAttributes = {
	className: string;
	allowResponsive: boolean;
	providerNameSlug: string;
	responsive: boolean;
	type: string;
	url: string;
};

export type CoreEmbedVideoPressVariationBlockAttributes = CoreEmbedBlockAttributes & {
	providerNameSlug: 'videopress';
	type: 'video';
};

export type VideoBlockSetAttributesProps = ( attributes: VideoBlockAttributes ) => void;

export type VideoControlProps = {
	/**
	 * Block Attributes object.
	 */
	attributes: VideoBlockAttributes;

	setAttributes: VideoBlockSetAttributesProps;

	clientId?: string;

	privateEnabledForSite?: boolean;
};

export type VideoEditProps = VideoControlProps;

export type DetailsPanelProps = VideoControlProps & {
	filename: string;
	chapter: TrackProps;
	isAutoGeneratedChapter: boolean;
	updateError: object | null;
	isRequestingVideoData: boolean;
};

export type VideoPreviewProps = {
	html: string;
	width: number;
	height: number;
	thumbnail_height: number;
	thumbnail_width: number;
	version: string;
	title: string;
	type: string;
	provider_name: string;
	provider_url: string;
};
