export class Audio {
  constructor(
    public url: string,
    public name: string,
    public desc: string,
    public volumeFactor: number,
    public barHeight: number,
    public durationStr: string,
    public type: string,
    public artist: string,
    public coverImgUrl: string,
  ) {}
}