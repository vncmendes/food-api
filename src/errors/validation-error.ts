export class ValidationError extends Error {
  constructor() {
    super("Sorry, user not found !");
  }
}