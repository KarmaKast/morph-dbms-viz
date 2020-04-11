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
    label?: morphCore.Structs.Collection["Label"],
    sourceCollection?: morphCore.Structs.Collection,
    vizCollection?: morphCore.Structs.Collection
  ) {
    if (label) {
      this.sourceCollection = morphCore.Collection.createNew(label);
    } else if (sourceCollection) {
      this.sourceCollection = sourceCollection;
    } else throw new Error("Must provide a label or an existing collection");
    if (vizCollection) {
      this.vizCollection = vizCollection;
    } else {
      const relation = morphCore.createRelation("properties of");
      this.vizCollection = morphCore.Collection.createNew(
        this.sourceCollection.Label + "__vizCollection__",
        undefined,
        new Map([[relation.ID, relation]])
      );
      this.initializeVizCollection();
    }
  }
  initializeVizCollection(): void {
    const propRelation = Array.from(
      new morphCore.ExperimentalQuery.QueryRunner.QueryCollection(
        this.vizCollection,
        this.vizCollection["ID"]
      )
        .usesRelation("properties of")
        .collection.Relations.values()
    )[0];
    for (const [, entity] of this.sourceCollection.Entities) {
      const vizEntity = morphCore.Entity.createNew(
        undefined,
        "__props__",
        undefined,
        new Map(
          Object.entries({
            location: { x: 0, y: 0, z: 0 },
            color: { h: 0, s: 0, l: 0, a: 0 },
            size: 1,
            selected: false,
          } as VizProp)
        )
      );
      morphCore.Entity.claimRelation(
        propRelation,
        morphCore.Direction.SelfToTarget,
        vizEntity,
        entity
      );

      this.vizCollection.Entities.set(vizEntity.ID, vizEntity);
    }
  }
  save(databasePath: string): void {
    morphCore.Files.initDatabase(databasePath).then(() => {
      morphCore.Files.writeCollection(this.sourceCollection, databasePath);
      morphCore.Files.writeCollection(this.vizCollection, databasePath);
    });
  }
}

export function load(
  databasePath: string,
  collectionID?: morphCore.Structs.Collection["ID"],
  label?: morphCore.Structs.Collection["Label"]
): Viz {
  const sourceCollection = morphCore.Files.readCollection(
    databasePath,
    collectionID,
    label
  );
  const vizCollectionsDense = morphCore.Files.findCollectionWithLabel(
    databasePath,
    sourceCollection.Label + "__vizCollection__"
  );
  let vizCollection;
  if (vizCollectionsDense)
    vizCollection = morphCore.Files.readCollection(
      databasePath,
      vizCollectionsDense[0].ID
    );
  else vizCollection = undefined;
  return new Viz(undefined, sourceCollection, vizCollection);
}
