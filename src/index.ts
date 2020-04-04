import * as morphCore from "@karmakast/morph-dbms-core";
export { morphCore };

export interface VizProp {
  location: { x: number; y: number; z: number };
  color: { h: number; s: number; l: number; a: number };
  size: number;
  selected: boolean;
}

export class Viz {
  sourceCollection: morphCore.Structs.Collection;
  vizCollection: morphCore.Structs.Collection;
  constructor(
    sourceCollection: morphCore.Structs.Collection,
    vizCollection?: morphCore.Structs.Collection
  ) {
    this.sourceCollection = sourceCollection;
    if (vizCollection) {
      this.vizCollection = vizCollection;
    } else {
      const relation = morphCore.createRelation("properties of");
      this.vizCollection = morphCore.Collection.createNew(
        "viz_cluster",
        undefined,
        { [relation.ID]: relation }
      );
      this.initializeVizCollection();
    }
  }
  initializeVizCollection(): void {
    const propRelation = Object.values(
      new morphCore.Query.QueryCollection(this.vizCollection).usesRelation(
        "properties of"
      ).collection.Relations
    )[0];
    for (const entityID in this.sourceCollection.Entities) {
      const vizEntity = morphCore.Entity.createNew(
        undefined,
        "__props__",
        undefined,
        {
          location: { x: 0, y: 0, z: 0 },
          color: { h: 0, s: 0, l: 0, a: 0 },
          size: 1,
          selected: false,
        } as VizProp
      );

      morphCore.Entity.claimRelation(
        propRelation,
        morphCore.Direction.SelfToTarget,
        vizEntity,
        this.sourceCollection.Entities[entityID]
      );

      this.vizCollection.Entities[vizEntity.ID] = vizEntity;
    }
  }
}
