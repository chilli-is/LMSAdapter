import AdapterError from "./AdapterError";
import LMSAdapterUtils from "./LMSAdapterUtils";

export default class SCORMGetterSetter {
  private _api: any;
  private _connected = false;

  constructor(api: any) {
    this._api = api;
  }

  set connected(value: boolean) {
    this._connected = value;
  }

  public getValue(key: string) {
    try {
      if (this._connected && this._api != null) {
        const value = this._api.LMSGetValue(key);

        this.getLastLMSError();

        return value.toString();
      }
    } catch (e) {
      throw new AdapterError(
        "Unable to get value from LMS (key: " + key + ")",
        { cause: e }
      );
    }

    return "";
  }

  public setValue(key: string, value: string): void {
    try {
      if (this._connected && this._api != null) {
        if (
          LMSAdapterUtils.isBool(this._api.LMSSetValue(key, value)) !== true
        ) {
          throw new Error(
            "Unsuccessful attempt to set the value of " +
              key +
              " in the LMS to " +
              value
          );
        }
      }
    } catch (e) {
      // const err = { cause: e } as any;
      throw new AdapterError(
        "Unexpected error when trying to set value in LMS (key: " + key + ")",
        { cause: e } as any
      );
    }
  }

  private getLastLMSError(): void {
    const errCode = this._api.LMSGetLastError().toString();

    if (errCode != 0) {
      // if the error is anything other than a 401 not implemented error, throw it
      if (parseInt(errCode) != 401) {
        throw new Error("Unexpected error from LMS.  Code " + errCode);
      }

      // an error was encountered so display the error description
      const errDescription = this._api.LMSGetErrorString(errCode);

      throw new Error("LMS error " + errCode + ", " + errDescription);
    }
  }
}