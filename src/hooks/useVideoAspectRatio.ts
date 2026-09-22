"use client";

import { useEffect, useState, type RefObject } from "react";

// MediaPipe's landmark x/y are normalized 0-1 against the raw camera
// frame, not against whatever CSS box the <video> happens to render
// into. If that box's aspect ratio doesn't match the camera's own
// (object-cover cropping to fit a fixed 16:9 box, say, when the camera
// is actually 4:3), the overlay's dots drift from the real tracked
// points the further out from center they are. Reading the camera's
// actual resolution and sizing the box to match keeps the mapping 1:1.
export function useVideoAspectRatio(videoRef: RefObject<HTMLVideoElement | null>): number {
  const [ratio, setRatio] = useState(4 / 3);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    function updateRatio() {
      if (video && video.videoWidth > 0 && video.videoHeight > 0) {
        setRatio(video.videoWidth / video.videoHeight);
      }
    }

    updateRatio();
    video.addEventListener("loadedmetadata", updateRatio);
    return () => video.removeEventListener("loadedmetadata", updateRatio);
  }, [videoRef]);

  return ratio;
}
