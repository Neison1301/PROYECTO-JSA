
export class Ventanas {
  constructor(
    public id: string,
    public title: string,
    public component: string,
    public position: { x: number; y: number; },
    public size: { width: number; height: number; },
    public isMinimized: boolean,
    public isMaximized: boolean,
    public zIndex: number,
    public previousPosition?: { x: number; y: number; },
    public previousSize?: { width: number; height: number; }
  ) {}
}