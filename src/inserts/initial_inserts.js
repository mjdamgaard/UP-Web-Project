


const initialEntDefObj = [
  "tag",
  "type",
  "entity",
];




export function insertInitialEntities(entityInserter) {
  entityInserter.insertOrFind(initialEntDefObj);
}