
import { BaseTopology } from './topologies/BaseTopology';
import { PlusShapeTopology } from './topologies/PlusShape';
import { SpiralTopology } from './topologies/Spiral';
import { LShapeTopology } from './topologies/LShape';
import { GridTopology } from './topologies/Grid';
import { StarShapeTopology } from './topologies/StarShape';

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
    this.register('plus_shape', new PlusShapeTopology());
    this.register('spiral', new SpiralTopology());
    this.register('l_shape', new LShapeTopology());
    this.register('grid', new GridTopology());
    this.register('star_shape', new StarShapeTopology());
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
}
