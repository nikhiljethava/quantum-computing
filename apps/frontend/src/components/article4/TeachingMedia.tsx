"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

import { ARTICLE4_ASSET_ROOT, type Article4Lesson } from "@/content/article4";

export interface TeachingMediaProps {
  lesson: Article4Lesson;
  mode: "watch" | "steps";
  onMediaPlay?: (format: "mp4" | "gif") => void;
}

const buttonStyle = "min-h-11 border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-800 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 disabled:cursor-not-allowed disabled:opacity-45";

function localAsset(path: string | undefined): string | undefined {
  if (!path || !path.startsWith(`${ARTICLE4_ASSET_ROOT}/`)) return undefined;
  const filename = path.slice(ARTICLE4_ASSET_ROOT.length + 1);
  return /^[a-z0-9_-]+\.(png|mp4|gif)$/.test(filename) ? path : undefined;
}

function IntentVideo({ src, poster, label, onFailure }: {
  src: string;
  poster: string;
  label: string;
  onFailure: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    let active = true;
    // Restore after React's development setup/cleanup probe as well.
    video.setAttribute("src", src);
    // This component exists only after the reader presses Play. Nothing is
    // loaded or played by page entry, lesson entry, or reduced-motion settings.
    void video.play().catch(() => {
      if (active) onFailure();
    });
    return () => {
      active = false;
      video.pause();
      video.removeAttribute("src");
      video.load();
    };
  }, [src, onFailure]);

  return <video ref={videoRef} src={src} poster={poster} controls playsInline preload="none" onError={onFailure} aria-label={label} className="block h-auto w-full" />;
}

function TeachingMediaScene({ lesson, mode, onMediaPlay }: TeachingMediaProps) {
  const [movingFormat, setMovingFormat] = useState<"mp4" | "gif" | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [failedAsset, setFailedAsset] = useState<string | null>(null);
  const [playbackError, setPlaybackError] = useState(false);
  const mp4 = localAsset(lesson.media.mp4);
  const gif = localAsset(lesson.media.gif);
  const still = localAsset(lesson.media.still);
  const step = lesson.media.steps[stepIndex];
  const stepImage = localAsset(step?.image);
  const hasAllStepImages = lesson.media.steps.length === 4 && lesson.media.steps.every((item) => Boolean(localAsset(item.image)));
  const displayedImage = mode === "steps" && stepImage ? stepImage : still;
  const captionId = `${lesson.id}-media-caption`;
  const stepTextId = `${lesson.id}-step-text`;
  const failPlayback = useCallback(() => {
    setMovingFormat(null);
    setPlaybackError(true);
  }, []);

  function play(format: "mp4" | "gif") {
    if (!(format === "mp4" ? mp4 : gif)) return;
    setPlaybackError(false);
    setMovingFormat(format);
    // Optional analytics must not interrupt an explicit playback action.
    try {
      void Promise.resolve(onMediaPlay?.(format)).catch(() => undefined);
    } catch {
      // The media still works when an observer is unavailable.
    }
  }

  const imageFailed = displayedImage === failedAsset;

  return (
    <div data-testid="teaching-media" data-lesson={lesson.id} data-mode={mode}>
      {mode === "watch" ? (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="mr-2 text-sm font-bold text-slate-700">Watch the preset example</span>
          {mp4 ? <button type="button" className={buttonStyle} onClick={() => play("mp4")}>Play video</button> : null}
          {gif ? <button type="button" className={buttonStyle} onClick={() => play("gif")}>Use GIF alternative</button> : null}
          {movingFormat ? <button type="button" className={buttonStyle} onClick={() => setMovingFormat(null)}>Stop and show still</button> : null}
        </div>
      ) : (
        <div className="mb-4 flex flex-wrap gap-2" role="group" aria-label="Manual lesson steps">
          {lesson.media.steps.map((item, index) => (
            <button key={item.text} type="button" aria-pressed={stepIndex === index} aria-controls={stepTextId} className={`${buttonStyle} ${stepIndex === index ? "!border-blue-700 !bg-blue-50 !text-blue-800" : ""}`} onClick={() => setStepIndex(index)}>
              Step {index + 1}
            </button>
          ))}
        </div>
      )}

      {mode === "watch" && (!mp4 || !gif) ? (
        <p className="mb-4 border-l-2 border-amber-500 pl-3 text-sm leading-6 text-slate-700" data-testid="missing-moving-media">
          {!mp4 && !gif ? "The original video and GIF have not been supplied. The V9 still and explanation are available below." : !mp4 ? "The original MP4 has not been supplied. A still and GIF alternative are available." : "The original GIF has not been supplied. A still and MP4 are available."}
        </p>
      ) : null}

      {mode === "steps" && !hasAllStepImages ? (
        <p className="mb-4 border-l-2 border-amber-500 pl-3 text-sm leading-6 text-slate-700" data-testid="missing-step-images">
          Numbered step images have not been supplied. This text walkthrough is adapted from V9; the original overview figure stays fixed when a step image is unavailable.
        </p>
      ) : null}

      {playbackError ? <p role="status" className="mb-4 text-sm font-semibold leading-6 text-amber-900">Playback could not continue. The still and its explanation remain available; you can retry using a playback button.</p> : null}

      <figure aria-describedby={captionId}>
        <div className="flex min-h-40 items-center justify-center overflow-hidden border border-slate-200 bg-white" style={{ aspectRatio: lesson.id === "loss" ? "1240 / 515" : "1240 / 490" }}>
          {mode === "watch" && movingFormat === "mp4" && mp4 && still ? (
            <IntentVideo src={mp4} poster={still} label={`${lesson.title}: preset teaching video`} onFailure={failPlayback} />
          ) : mode === "watch" && movingFormat === "gif" && gif ? (
            <Image src={gif} alt={lesson.media.alt} width={1240} height={lesson.id === "loss" ? 515 : 490} unoptimized onError={failPlayback} className="block h-auto w-full" />
          ) : displayedImage && !imageFailed ? (
            <Image key={displayedImage} src={displayedImage} alt={mode === "steps" && stepImage ? `${lesson.title}, step ${stepIndex + 1}: ${step.text}` : lesson.media.alt} width={1240} height={lesson.id === "loss" ? 515 : 490} unoptimized onError={() => setFailedAsset(displayedImage)} className="block h-auto w-full" />
          ) : (
            <div role="status" className="max-w-2xl px-5 py-8 text-sm leading-7 text-slate-700">
              <p className="font-bold">The image could not load.</p>
              <p>{lesson.media.alt}</p>
            </div>
          )}
        </div>
        <figcaption id={captionId} className="mt-3 text-sm leading-7 text-slate-600">{lesson.media.caption}</figcaption>
      </figure>

      {mode === "steps" && step ? (
        <div className="mt-5 border-t border-slate-200 pt-5">
          <div id={stepTextId} aria-live="polite" aria-atomic="true">
            <p className="text-xs font-bold uppercase tracking-wide text-blue-700">Step {stepIndex + 1} of {lesson.media.steps.length}</p>
            <p className="mt-2 text-base leading-8 text-slate-800">{step.text}</p>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" className={buttonStyle} disabled={stepIndex === 0} onClick={() => setStepIndex((index) => index - 1)}>Previous step</button>
            <button type="button" className={buttonStyle} disabled={stepIndex >= lesson.media.steps.length - 1} onClick={() => setStepIndex((index) => index + 1)}>Next step</button>
          </div>
          <p className="mt-3 text-xs leading-6 text-slate-500">Advance at your own pace. Steps never move automatically.</p>
        </div>
      ) : null}
    </div>
  );
}

export function TeachingMedia(props: TeachingMediaProps) {
  // Changing the lesson or mode unmounts the scene and its moving media.
  // Entering Explore is handled by the parent unmounting this component.
  return <TeachingMediaScene key={`${props.lesson.id}-${props.mode}`} {...props} />;
}
