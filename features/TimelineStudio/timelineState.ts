export type TrackType = 'video' | 'audio' | 'effect';

export interface TimelineTrack {
    id: string;
    type: TrackType;
    name: string;
}

export interface TimelineClip {
    id: string;
    source: string;
    startTime: number;
    duration: number;
    trackId: string;
    title: string;
}

export interface AssetFolder {
    id: string;
    name: string;
    color: string;
}

export interface TimelineState {
    tracks: TimelineTrack[];
    clips: TimelineClip[];
    folders: AssetFolder[];
    currentTime: number;
    isPlaying: boolean;
}

export const initialTimelineState: TimelineState = {
    tracks: [
        { id: 'v2', type: 'video', name: 'V2' },
        { id: 'v1', type: 'video', name: 'V1' },
        { id: 'fx1', type: 'effect', name: 'FX' },
        { id: 'a1', type: 'audio', name: 'A1' },
        { id: 'a2', type: 'audio', name: 'A2' },
    ],
    clips: [],
    folders: [
        { id: 'f-raw', name: 'RAW GENERATIONS', color: '#10b981' },
        { id: 'f-ups', name: 'UPSCALED', color: '#4285f4' },
        { id: 'f-sfx', name: 'SOUND EFFECTS', color: '#f59e0b' }
    ],
    currentTime: 0,
    isPlaying: false
};

