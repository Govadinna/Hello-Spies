
export interface PlayerAssignment {
  playerId: number;
  word: string;
  isSpy: boolean;
}

export interface GameSetup {
  theme: string;
  assignments: PlayerAssignment[];
}

export enum GameState {
  SETUP = 'SETUP',
  LOADING = 'LOADING',
  DEALING = 'DEALING',
  DISCUSSION = 'DISCUSSION',
  REVEAL = 'REVEAL'
}
