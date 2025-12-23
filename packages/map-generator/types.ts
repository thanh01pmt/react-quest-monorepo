
export type Coord = [number, number, number];

export interface IObstacle {
  pos: Coord;
  modelKey?: string;
  is_surface_obstacle?: boolean;
  [key: string]: any;
}

export interface IItem {
  type: string;
  pos: Coord;
  initial_state?: string; // For switches
  pattern_id?: string;
  segment_idx?: number;
  [key: string]: any;
}

export interface IPathInfo {
  start_pos: Coord;
  target_pos: Coord;
  path_coords: Coord[];
  placement_coords: Coord[];
  obstacles: IObstacle[];
  metadata: Record<string, any>;
}

export interface IMapData {
  grid_size: [number, number, number];
  start_pos: Coord;
  target_pos: Coord;
  items: IItem[];
  obstacles: IObstacle[];
  placement_coords: Coord[];
  params: Record<string, any>;
  map_type: string;
  logic_type: string;
  path_coords: Coord[];
  branch_coords: Coord[][];
  metadata: Record<string, any>;
}

export interface ISegmentAnalysis {
  count: number;
  lengths: number[];
  min_length: number;
  max_length: number;
  min_valid_range: number;
  total_valid_slots: number;
}
