export type Face = "U" | "D" | "F" | "B" | "L" | "R";
export type Dir = "N" | "E" | "S" | "W";

export type RC = 0 | 1 | 2 | 3;

export type Pos = {
  face: Face;
  r: RC;
  c: RC;
};

export type Color = "W" | "B";
export type PieceKind = "K" | "Q" | "R" | "B" | "N" | "P";

export type Piece = {
  id: string;
  color: Color;
  kind: PieceKind;
  facesCrossed?: number;
};

