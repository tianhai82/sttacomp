// web/src/lib/types.ts

export interface Player {
  na: string;
  name: string;
  position: number | null;
}

export interface Group {
  winner: Player;
  hasRunnerUp: boolean;
  runnerUp: Player | null;
}

export interface DrawPrepState {
  id: string;
  createdAt: number;
  numGroups: number;
  groups: Group[];
  round: number;
  baseWinnerPositions: number[];
  baseRunnerUpPositions: number[];
  baseByePositions: number[];
  eventName: string;
}
