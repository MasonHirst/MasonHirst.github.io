export class Audio {
  constructor(
    public url: string,
    public name: string,
    public durationStr: string,
    public type: string,
    public artist: string,
    public coverImgUrl: string,
  ) {}
}