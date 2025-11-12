

export class Queue {

  constructor() {
    this.head = null
    this.tail = null;
  }

  enqueue(value) {
    let newEntry = [this.tail, value, null];
    if (this.tail) this.tail[2] = newEntry;
    this.tail = newEntry;
    if (!this.head) this.head = newEntry;
  }

  dequeue() {
    let entry = this.head;
    if (!entry) return undefined;
    let newHead = entry[2];
    if (newHead) newHead[0] = null;
    this.head = newHead;
    return entry[1];
  }
}