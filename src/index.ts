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
  private _propRelation: morphCore.Structs.Relation;
  constructor(
    label?: morphCore.Structs.Collection["Label"],
    sourceCollection?: morphCore.Structs.Collection,
    vizCollection?: morphCore.Structs.Collection
  ) {
    if (vizCollection) {
      this._propRelation = Array.from(vizCollection.Relations.values())[0];
    } else {
      const relation = morphCore.createRelation("properties of");
      this._propRelation = relation;
    }
    if (label) {
      this.sourceCollection = morphCore.Collection.createNew(label);
    } else if (sourceCollection) {
      this.sourceCollection = sourceCollection;
    } else throw new Error("Must provide a label or an existing collection");
    if (vizCollection) {
      this.vizCollection = vizCollection;
    } else {
      this.vizCollection = morphCore.Collection.createNew(
        this.sourceCollection.Label + "__vizCollection__",
        undefined,
        new Map([[this._propRelation.ID, this._propRelation]])
      );
      this.initializeVizCollection();
    }
  }
  initializeEntityViz(
    sourceEntityID: morphCore.Structs.Entity["ID"],
    vizProp?: Partial<VizProp>
  ): morphCore.Structs.Entity | null {
    const sourceEntity = this.sourceCollection.Entities.get(sourceEntityID);
    if (sourceEntity) {
      const vizEntity = morphCore.Entity.createNew(
        undefined,
        "__props__",
        undefined,
        new Map(
          Object.entries({
            location:
              vizProp && vizProp.location
                ? vizProp.location
                : { x: 0, y: 0, z: 0 },
            color:
              vizProp && vizProp.color
                ? vizProp.color
                : { h: 0, s: 0, l: 0, a: 0 },
            size: vizProp && vizProp.size ? vizProp.size : 1,
            selected: vizProp && vizProp.selected ? vizProp.selected : false,
          } as VizProp)
        )
      );
      morphCore.Entity.claimRelation(
        this._propRelation,
        morphCore.Direction.SelfToTarget,
        vizEntity,
        sourceEntity
      );
      this.vizCollection.Entities.set(vizEntity.ID, vizEntity);
      return vizEntity;
    } else return null;
  }
  initializeVizCollection(): void {
    for (const [entityID] of this.sourceCollection.Entities) {
      this.initializeEntityViz(entityID);
    }
  }
  save(databasePath: string, mode?: "reset"): void {
    morphCore.Files.initDatabase(databasePath, mode).then(() => {
      morphCore.Files.writeCollection(this.sourceCollection, databasePath);
      morphCore.Files.writeCollection(this.vizCollection, databasePath);
    });
  }
  clear(): void {
    this.sourceCollection.Entities = new Map();
    this.sourceCollection.Relations = new Map();
    this.vizCollection.Entities = new Map();
  }

  createEntity(vizProp?: Partial<VizProp>): morphCore.Structs.Entity["ID"] {
    const newEntity = morphCore.Entity.createNew();
    this.sourceCollection.Entities.set(newEntity.ID, newEntity);
    this.initializeEntityViz(newEntity.ID, vizProp);
    return newEntity.ID;
  }
  /**
   * removes source entity and its corresponding viz entity
   */
  removeEntity(sourceEntityID: morphCore.Structs.Entity["ID"]): void {
    this.vizCollection.Entities.delete(this.getVizEntity(sourceEntityID).ID);
    this.sourceCollection.Entities.delete(sourceEntityID);
  }
  getVizEntity(
    sourceEntityID: morphCore.Structs.Entity["ID"]
  ): morphCore.Structs.Entity {
    const sourceEntity = this.sourceCollection.Entities.get(sourceEntityID);
    if (sourceEntity)
      return Array.from(
        new morphCore.ExperimentalQuery.QueryRunner.QueryCollection(
          this.vizCollection,
          this.vizCollection.ID
        )
          .hasRelationClaim(
            Array.from(this.vizCollection.Relations.values())[0].ID,
            morphCore.Direction.SelfToTarget,
            sourceEntity
          )
          .collection.Entities.values()
      )[0];
    else throw new Error("No entity with ID : " + sourceEntityID);
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
      vizCollectionsDense[0].ID,
      undefined,
      (entityID) => {
        const entity = sourceCollection.Entities.get(entityID);
        if (entity) return entity;
        else return null;
      },
      (relationID) => {
        const relation = sourceCollection.Relations.get(relationID);
        if (relation) return relation;
        else return null;
      }
    );
  else vizCollection = undefined;
  return new Viz(undefined, sourceCollection, vizCollection);
}
