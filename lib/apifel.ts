// Kastas inuti transaktioner/handlers för att avbryta med en specifik
// HTTP-status istället för generiskt 500
export class ApiFel extends Error {
  constructor(
    public readonly status: number,
    message: string
  ) {
    super(message);
    this.name = "ApiFel";
  }
}
