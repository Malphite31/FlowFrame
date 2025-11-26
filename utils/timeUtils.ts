export const FPS = 24;

export const framesToTimecode = (totalFrames: number): string => {
  const hours = Math.floor(totalFrames / (3600 * FPS));
  const minutes = Math.floor((totalFrames % (3600 * FPS)) / (60 * FPS));
  const seconds = Math.floor(((totalFrames % (3600 * FPS)) % (60 * FPS)) / FPS);
  const frames = Math.floor(totalFrames % FPS);

  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}:${pad(frames)}`;
};

export const secondsToTimecode = (totalSeconds: number): string => {
  return framesToTimecode(Math.round(totalSeconds * FPS));
};

export const secondsToFrames = (seconds: number): number => {
  return Math.round(seconds * FPS);
};
