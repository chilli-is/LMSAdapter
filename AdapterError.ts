export default class AdapterError extends Error {
  private _msg = "";
  constructor(msg: string, ...params: any) {
    super(...params);

    this.name = "AdapterError";
    this._msg = msg;
  }

  get msg(): string {
    return this._msg;
  }
}
