declare global {
  interface Window {
    cocoSsd: {
      load: () => Promise<{
        detect: (video: HTMLVideoElement) => Promise<Array<{ class: string }>>;
      }>;
    };
    FaceMesh: new (config: { locateFile: (file: string) => string }) => {
      setOptions: (opts: Record<string, unknown>) => void;
      onResults: (cb: (results: { multiFaceLandmarks?: Array<Array<{ x: number }>> }) => void) => void;
      initialize: () => Promise<void>;
      send: (data: { image: HTMLVideoElement }) => Promise<void>;
    };
  }
}

export {};
