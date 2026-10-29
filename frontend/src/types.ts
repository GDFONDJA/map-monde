export interface PlayerProfile { name: string; language: string; country: string; }
export interface Piece {
  id: string; title: string; file: string; type: string; description: string;
  box: { x: number; y: number; largeur: number; hauteur: number };
  point: number[];
}
export interface Stage {
  id: string; title: string; heading: string; kind: string; unit: string;
  description: string; pieces: Piece[];
  displayBounds?: { x: number; y: number; width: number; height: number };
}
export interface PersonalRecord { score: number; time: number; helps: number; errors: number; }
export interface PieceDrag {
  ghost: HTMLImageElement; pointer: number; startX: number; startY: number;
  anchorX: number; anchorY: number; moved: boolean;
}
