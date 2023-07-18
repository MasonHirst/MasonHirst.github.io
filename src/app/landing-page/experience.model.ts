export class ExperienceModel {
  constructor(
    public relevant: boolean,
    private title: string,
    private company: string,
    private companyLogo: string,
    private location: string,
    private startDate: string,
    private endDate: string,
    private description: string,
    private descPoints: string[],
  ) {}
}
