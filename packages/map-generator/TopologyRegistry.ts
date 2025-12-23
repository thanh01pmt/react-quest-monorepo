
import { BaseTopology } from './topologies/BaseTopology';
import { PlusShapeTopology } from './topologies/PlusShape';
import { SpiralTopology } from './topologies/Spiral';
import { LShapeTopology } from './topologies/LShape';
import { GridTopology } from './topologies/Grid';
import { StarShapeTopology } from './topologies/StarShape';
import { StraightLineTopology } from './topologies/StraightLine';
import { ZigzagTopology } from './topologies/Zigzag';
import { TShapeTopology } from './topologies/TShape';
import { UShapeTopology } from './topologies/UShape';
import { VShapeTopology } from './topologies/VShape';
import { SShapeTopology } from './topologies/SShape';
import { HShapeTopology } from './topologies/HShape';
import { ZShapeTopology } from './topologies/ZShape';
import { ArrowShapeTopology } from './topologies/ArrowShape';
import { TriangleTopology } from './topologies/Triangle';
import { SquareTopology } from './topologies/Square';
import { SimplePathTopology } from './topologies/SimplePath';
import { StaircaseTopology } from './topologies/Staircase';
import { PlowingFieldTopology } from './topologies/PlowingField';
import { EFShapeTopology } from './topologies/EFShape';
import { GridWithHolesTopology } from './topologies/GridWithHoles';
import { ComplexMazeTopology } from './topologies/ComplexMaze';
import { Spiral3DTopology } from './topologies/Spiral3D';
import { Staircase3DTopology } from './topologies/Staircase3D';
import { SymmetricalIslandsTopology } from './topologies/SymmetricalIslands';
import { HubWithSteppedIslandsTopology } from './topologies/HubWithSteppedIslands';
import { InterspersedPathTopology } from './topologies/InterspersedPath';
import { PlusShapeIslandsTopology } from './topologies/PlusShapeIslands';
import { SteppedIslandClustersTopology } from './topologies/SteppedIslandClusters';
import { SwiftPlaygroundMazeTopology } from './topologies/SwiftPlaygroundMaze';

export class TopologyRegistry {
  private static instance: TopologyRegistry;
  private topologies: Map<string, BaseTopology>;

  private constructor() {
    this.topologies = new Map();
    this.registerDefaults();
  }

  public static getInstance(): TopologyRegistry {
    if (!TopologyRegistry.instance) {
      TopologyRegistry.instance = new TopologyRegistry();
    }
    return TopologyRegistry.instance;
  }

  private registerDefaults() {
    // Basic topologies
    this.register('simple_path', new SimplePathTopology());
    this.register('straight_line', new StraightLineTopology());
    this.register('zigzag', new ZigzagTopology());
    this.register('staircase', new StaircaseTopology());
    
    // Shape topologies - Letters
    this.register('l_shape', new LShapeTopology());
    this.register('t_shape', new TShapeTopology());
    this.register('u_shape', new UShapeTopology());
    this.register('v_shape', new VShapeTopology());
    this.register('s_shape', new SShapeTopology());
    this.register('h_shape', new HShapeTopology());
    this.register('z_shape', new ZShapeTopology());
    this.register('ef_shape', new EFShapeTopology());
    
    // Shape topologies - Symbols
    this.register('plus_shape', new PlusShapeTopology());
    this.register('star_shape', new StarShapeTopology());
    this.register('arrow_shape', new ArrowShapeTopology());
    
    // Geometric shapes
    this.register('triangle', new TriangleTopology());
    this.register('square', new SquareTopology());
    
    // 2D Complex topologies
    this.register('spiral', new SpiralTopology());
    this.register('grid', new GridTopology());
    this.register('plowing_field', new PlowingFieldTopology());
    this.register('grid_with_holes', new GridWithHolesTopology());
    this.register('complex_maze', new ComplexMazeTopology());
    this.register('interspersed_path', new InterspersedPathTopology());
    
    // Island topologies
    this.register('plus_shape_islands', new PlusShapeIslandsTopology());
    this.register('symmetrical_islands', new SymmetricalIslandsTopology());
    this.register('stepped_island_clusters', new SteppedIslandClustersTopology());
    this.register('hub_stepped_islands', new HubWithSteppedIslandsTopology());
    
    // 3D topologies
    this.register('spiral_3d', new Spiral3DTopology());
    this.register('staircase_3d', new Staircase3DTopology());
    this.register('swift_playground_maze', new SwiftPlaygroundMazeTopology());
  }

  public register(name: string, topology: BaseTopology) {
    this.topologies.set(name, topology);
  }

  public get(name: string): BaseTopology | undefined {
    return this.topologies.get(name);
  }

  public getAll(): string[] {
    return Array.from(this.topologies.keys());
  }

  /**
   * Get topologies grouped by category for UI
   */
  public getGrouped(): { category: string; items: string[] }[] {
    return [
      { 
        category: 'Basic', 
        items: ['simple_path', 'straight_line', 'zigzag', 'staircase'] 
      },
      { 
        category: 'Letters', 
        items: ['l_shape', 't_shape', 'u_shape', 'v_shape', 's_shape', 'h_shape', 'z_shape', 'ef_shape'] 
      },
      { 
        category: 'Symbols', 
        items: ['plus_shape', 'star_shape', 'arrow_shape'] 
      },
      {
        category: 'Geometric',
        items: ['triangle', 'square']
      },
      { 
        category: 'Complex 2D', 
        items: ['spiral', 'grid', 'plowing_field', 'grid_with_holes', 'complex_maze', 'interspersed_path'] 
      },
      {
        category: 'Islands',
        items: ['plus_shape_islands', 'symmetrical_islands', 'stepped_island_clusters', 'hub_stepped_islands']
      },
      {
        category: '3D Multi-Level',
        items: ['spiral_3d', 'staircase_3d', 'swift_playground_maze']
      }
    ];
  }

  /**
   * Get display name for a topology
   */
  public getDisplayName(key: string): string {
    const names: Record<string, string> = {
      // Basic
      'simple_path': 'Simple Path',
      'straight_line': 'Straight Line',
      'zigzag': 'Zigzag',
      'staircase': 'Staircase 🪜',
      // Letters
      'l_shape': 'L Shape',
      't_shape': 'T Shape',
      'u_shape': 'U Shape',
      'v_shape': 'V Shape',
      's_shape': 'S Shape',
      'h_shape': 'H Shape',
      'z_shape': 'Z Shape',
      'ef_shape': 'E/F Shape',
      // Symbols
      'plus_shape': 'Plus Shape (+)',
      'star_shape': 'Star Shape (⭐)',
      'arrow_shape': 'Arrow Shape (→)',
      // Geometric
      'triangle': 'Triangle △',
      'square': 'Square □',
      // Complex 2D
      'spiral': 'Spiral 🌀',
      'grid': 'Grid',
      'plowing_field': 'Plowing Field 🚜',
      'grid_with_holes': 'Grid with Holes',
      'complex_maze': 'Complex Maze 🧩',
      'interspersed_path': 'Branching Path 🌿',
      // Islands
      'plus_shape_islands': 'Plus Islands (+)',
      'symmetrical_islands': 'Symmetrical Islands 🏝️',
      'stepped_island_clusters': 'Stepped Clusters ⬆️',
      'hub_stepped_islands': 'Hub + Islands 🌟',
      // 3D
      'spiral_3d': 'Spiral 3D 🔄',
      'staircase_3d': 'Staircase 3D ⬆️',
      'swift_playground_maze': 'Swift Maze 🎮'
    };
    return names[key] || key;
  }
}
